// app/api/cockpit-chat/route.ts
//
// Cockpit chat handler — mode-aware (normal | review).
//
// Body schema (unchanged from previous handler):
//   { chatId?, message, messages?, productId?, system? }
//
// On each request:
//   1. Resolve session via getSessionProfile() — anonymous users get the
//      conversational prompt without persistence.
//   2. If authenticated, look up admin_chat_mode(user_id) → mode.
//   3. Pick the matching pre-computed system prompt
//      (CONVERSATIONAL_PROMPT vs FACILITATOR_PROMPT).
//   4. Load / create chat via getServerClient (RLS-bound, user-owned).
//   5. Insert user message with mode column stamped.
//   6. Stream Kimi, strip <think> blocks, accumulate full response.
//   7. Persist assistant message with mode column stamped + llm_runs row.
//
// Returns: raw text stream with header `x-chat-id`.

import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import {
  estimateTokens,
  estimateKimiCostUsd,
} from "@hearst/review-mode";
import { kimi, KIMI_MODEL, kimiChatStream } from "@/lib/llm/kimi";
import { buildOracleSystemPrompt, inferOracleContextFromPath } from "@/lib/oracle-system-prompt";
import { getSessionProfile } from "@/lib/supabase-server";
import { isSafeDemoMode, DEMO_DISABLED_RESPONSE } from "@/lib/demo-mode";
import { getAdminChatMode, insertLlmRun } from "@/lib/review-mode/supabase-helpers";
import {
  parseTuningCommand,
  addTuning,
  listActiveTunings,
  removeTuningByShortId,
  clearTunings,
  renderTuningBlock,
  helpText,
} from "@/lib/review-mode/user-tuning";

// Service-role client for chat persistence. We manually scope every operation
// by user_id (resolved from getSessionProfile) so this bypasses RLS safely.
// Necessary because in dev autologin mode no Supabase auth cookie is set,
// which means auth.uid() is null and RLS rejects every insert.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
import {
  CONVERSATIONAL_PROMPT,
  CONVERSATIONAL_PROMPT_HASH,
  FACILITATOR_PROMPT,
  FACILITATOR_PROMPT_HASH,
} from "@/lib/review-mode/prompt-hash";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const BodySchema = z.object({
  chatId: z.string().nullish(),
  message: z.string().min(1, "Message vide"),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant", "system"]),
        content: z.string(),
      }),
    )
    .optional(),
  productId: z.string().nullish(),
  system: z.string().optional(), // ignored when authenticated (we control the prompt)
});

type Mode = "normal" | "review";

// ────────────────────────────────────────────────────────────────────────────
// In-memory rate limit (per-process, fallback for non-distributed deploys).
// ────────────────────────────────────────────────────────────────────────────
const memStore = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, max: number, windowMs: number) {
  if (memStore.size > 500) {
    const now = Date.now();
    for (const [k, v] of memStore) {
      if (now > v.resetAt) memStore.delete(k);
    }
  }
  const now = Date.now();
  const slot = memStore.get(key);
  if (!slot || now > slot.resetAt) {
    memStore.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false, retryAfter: 0 };
  }
  slot.count += 1;
  if (slot.count > max) {
    return { limited: true, retryAfter: Math.ceil((slot.resetAt - now) / 1000) };
  }
  return { limited: false, retryAfter: 0 };
}

// ────────────────────────────────────────────────────────────────────────────
// <think>...</think> stream-safe stripper (mirrors cockpit-shell behaviour).
// ────────────────────────────────────────────────────────────────────────────
function makeThinkStripper(): (chunk: string) => string {
  let buffer = "";
  let inThink = false;
  return function feed(chunk: string): string {
    buffer += chunk;
    let output = "";
    let i = 0;
    while (i < buffer.length) {
      if (!inThink) {
        const openIdx = buffer.indexOf("<think>", i);
        if (openIdx === -1) {
          const tail = buffer.slice(i);
          const OPEN_TAG = "<think>";
          let holdLen = 0;
          for (let p = Math.min(OPEN_TAG.length - 1, tail.length); p > 0; p--) {
            if (tail.endsWith(OPEN_TAG.slice(0, p))) {
              holdLen = p;
              break;
            }
          }
          output += tail.slice(0, tail.length - holdLen);
          buffer = holdLen > 0 ? tail.slice(tail.length - holdLen) : "";
          return output;
        }
        output += buffer.slice(i, openIdx);
        inThink = true;
        i = openIdx + 7;
      } else {
        const closeIdx = buffer.indexOf("</think>", i);
        if (closeIdx === -1) {
          buffer = buffer.slice(i);
          return output;
        }
        inThink = false;
        i = closeIdx + 8;
      }
    }
    buffer = "";
    return output;
  };
}

function genId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

export async function POST(req: Request) {
  // Wave 1 — SAFE_DEMO_MODE: the cockpit chat is ungrounded and can fabricate
  // figures. Disable it during presentations.
  if (isSafeDemoMode()) {
    return new Response(JSON.stringify(DEMO_DISABLED_RESPONSE), {
      status: 503, headers: { "content-type": "application/json" },
    });
  }
  // ── Parse body ──────────────────────────────────────────────────────────
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return new Response("Bad request", { status: 400 });
  }
  const parsed = BodySchema.safeParse(raw);
  if (!parsed.success) {
    return new Response(
      JSON.stringify({ error: parsed.error.issues[0]?.message ?? "Bad request" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const body = parsed.data;
  const message = body.message.trim();
  if (!message) return new Response("Empty message", { status: 400 });

  // ── Resolve session + mode ──────────────────────────────────────────────
  const session = await getSessionProfile();
  const userId = session?.user?.id ?? null;

  let mode: Mode = "normal";
  if (userId) {
    try {
      mode = await getAdminChatMode(userId);
    } catch (err) {
      console.warn("[cockpit-chat] getAdminChatMode failed", err);
    }
  }

  // ── Rate limit ──────────────────────────────────────────────────────────
  const rateKey =
    userId ??
    req.headers.get("x-vercel-forwarded-for") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const { limited, retryAfter } = checkRateLimit(rateKey, 20, 60_000);
  if (limited) {
    return new Response("Trop de requêtes — réessaie dans quelques instants.", {
      status: 429,
      headers: { "Retry-After": String(retryAfter) },
    });
  }

  // ── Load / create chat + history ────────────────────────────────────────
  const supa = getServiceClient();
  let chatId = body.chatId ?? null;
  const history: Array<{ role: "user" | "assistant" | "system"; content: string }> = [];

  if (userId) {
    try {
      if (!chatId) {
        const { data: newChat, error: createErr } = await supa
          .from("cockpit_chats")
          .insert({ user_id: userId })
          .select("id")
          .single();
        if (createErr) throw createErr;
        chatId = newChat.id as string;
      } else {
        const { data: rows, error: loadErr } = await supa
          .from("cockpit_messages")
          .select("role, content")
          .eq("chat_id", chatId)
          .order("created_at", { ascending: true });
        if (loadErr) throw loadErr;
        for (const r of rows ?? []) {
          const role = (r.role === "assistant" ? "assistant" : "user") as "assistant" | "user";
          history.push({ role, content: r.content as string });
        }
      }
    } catch (err) {
      console.warn("[cockpit-chat] persistence load/create failed", err);
      if (body.messages?.length) {
        for (const m of body.messages) {
          if (m.role && m.content) history.push({ role: m.role, content: m.content });
        }
      }
    }
  } else if (body.messages?.length) {
    for (const m of body.messages) {
      if (m.role && m.content) history.push({ role: m.role, content: m.content });
    }
  }

  // ── Persist user message (with mode stamp) ──────────────────────────────
  if (userId && chatId) {
    try {
      await supa.from("cockpit_messages").insert({
        chat_id: chatId,
        role: "user",
        content: message,
        mode,
      });
    } catch (err) {
      console.warn("[cockpit-chat] user message persist failed", err);
    }
  }
  history.push({ role: "user", content: message });

  // ── Tuning slash commands (intercept BEFORE the LLM) ────────────────────
  // Lets the user say "/pref réponds plus court" / "/règles" / "/oublie tout".
  // We answer synthetically, stream the answer (so the UI sees it), persist
  // it as an assistant message, and skip Kimi entirely.
  const tuningCmd = userId ? parseTuningCommand(message) : null;
  if (tuningCmd && userId) {
    let reply = "";
    if (tuningCmd.kind === "add") {
      const row = await addTuning(userId, tuningCmd.instruction);
      reply = row
        ? `Préférence enregistrée \`${row.id.slice(0, 8)}\` : « ${row.instruction} ».\n\nElle sera appliquée à tous tes prochains messages. \`/règles\` pour lister · \`/oublie ${row.id.slice(0, 8)}\` pour retirer.`
        : `Impossible d'enregistrer la préférence (vide ou >500 caractères).`;
    } else if (tuningCmd.kind === "list") {
      const rows = await listActiveTunings(userId);
      if (!rows.length) {
        reply = "Aucune préférence active. Ajoute-en une avec \`/pref <instruction>\`.";
      } else {
        const lines = rows.map(
          (r, i) => `${i + 1}. \`${r.id.slice(0, 8)}\` — ${r.instruction}`,
        );
        reply = `Préférences actives (${rows.length}) :\n${lines.join("\n")}`;
      }
    } else if (tuningCmd.kind === "clear") {
      const n = await clearTunings(userId);
      reply = n > 0 ? `Toutes les préférences supprimées (${n}).` : "Aucune préférence à supprimer.";
    } else if (tuningCmd.kind === "remove") {
      const ok = await removeTuningByShortId(userId, tuningCmd.shortId);
      reply = ok
        ? `Préférence \`${tuningCmd.shortId}\` supprimée.`
        : `Aucune préférence ne commence par \`${tuningCmd.shortId}\`.`;
    } else {
      reply = helpText();
    }

    if (chatId) {
      try {
        await supa.from("cockpit_messages").insert({
          chat_id: chatId,
          role: "assistant",
          content: reply,
          mode,
        });
      } catch (err) {
        console.warn("[cockpit-chat] tuning reply persist failed", err);
      }
    }

    const enc = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(enc.encode(reply));
        controller.close();
      },
    });
    const headers: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    };
    if (chatId) headers["x-chat-id"] = chatId;
    return new Response(stream, { headers });
  }

  // ── Pick system prompt based on mode + inject user tuning preferences ──
  const baseSystemPrompt = mode === "review" ? FACILITATOR_PROMPT : CONVERSATIONAL_PROMPT;
  let tuningBlock = "";
  if (userId) {
    try {
      const tunings = await listActiveTunings(userId);
      tuningBlock = renderTuningBlock(tunings);
    } catch (err) {
      console.warn("[cockpit-chat] tuning load failed", err);
    }
  }

  // ── ORACLE constitutional reasoning layer (Sprint 0) ─────────────────
  // Prefixe le system prompt pour aligner le raisonnement sur les 11 sections,
  // 6 perspectives, stakeholder mode, region + overlays. Heuristique par
  // pathname : /admin/hearst* → sovereign / qatar / Vision 2030 + Qatar AI.
  const oracleCtxBase = body.productId ? {} : inferOracleContextFromPath("/admin/hearst");
  const oracleCtx = {
    ...oracleCtxBase,
    // accepter override depuis le body (futur : front pourra envoyer stakeholder/region)
    stakeholder: (raw as { oracle?: { stakeholder?: string } })?.oracle?.stakeholder
      ?? oracleCtxBase.stakeholder,
    region: (raw as { oracle?: { region?: string } })?.oracle?.region
      ?? oracleCtxBase.region,
    overlays: (raw as { oracle?: { overlays?: string[] } })?.oracle?.overlays
      ?? oracleCtxBase.overlays,
    brevity: mode === "review" ? "deep" as const : "standard" as const,
    surface: "cockpit-chat" as const,
    product_context: body.productId ? `product=${body.productId}` : "oracle cockpit",
  };
  const oraclePrefix = buildOracleSystemPrompt(oracleCtx);

  const systemPrompt = oraclePrefix + "\n\n---\n\n" + baseSystemPrompt + tuningBlock;
  const promptHash = mode === "review" ? FACILITATOR_PROMPT_HASH : CONVERSATIONAL_PROMPT_HASH;
  const agentName = mode === "review" ? "cockpit-chat-review" : "cockpit-chat-normal";

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history,
  ];

  // ── Stream Kimi ─────────────────────────────────────────────────────────
  const inputTokens = estimateTokens(systemPrompt + history.map((h) => h.content).join("\n"));
  const startedAt = Date.now();
  let completion;
  let modelUsed = KIMI_MODEL;
  try {
    const out = await kimiChatStream({ model: KIMI_MODEL, messages } as any);
    completion = out.stream;
    modelUsed = out.model_used;
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM upstream error";
    await insertLlmRun({
      agentName,
      model: modelUsed,
      status: "failed",
      latencyMs: Date.now() - startedAt,
      userId,
      systemPromptHash: promptHash,
      inputTokens,
      outputTokens: null,
      costUsd: null,
      errorType: "upstream",
      errorMessage: msg,
    });
    return new Response("LLM upstream error", { status: 502 });
  }

  const stripThink = makeThinkStripper();
  let full = "";

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      try {
        for await (const part of completion) {
          if (req.signal.aborted) break;
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;
          const filtered = stripThink(delta);
          if (filtered) {
            full += filtered;
            controller.enqueue(enc.encode(filtered));
          }
        }
        const tail = stripThink("");
        if (tail) {
          full += tail;
          controller.enqueue(enc.encode(tail));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "LLM error";
        controller.enqueue(enc.encode(`\0ERROR:${msg}`));
        await insertLlmRun({
          agentName,
          model: modelUsed,
          status: "failed",
          latencyMs: Date.now() - startedAt,
          userId,
          systemPromptHash: promptHash,
          inputTokens,
          outputTokens: estimateTokens(full),
          costUsd: null,
          errorType: "stream",
          errorMessage: msg,
        });
        controller.close();
        return;
      }

      // ── Persist assistant message + llm_runs ────────────────────────────
      const latencyMs = Date.now() - startedAt;
      if (userId && chatId && full) {
        try {
          await supa.from("cockpit_messages").insert({
            chat_id: chatId,
            role: "assistant",
            content: full,
            mode,
          });
        } catch (err) {
          console.warn("[cockpit-chat] assistant persist failed", err);
        }
      }
      const outputTokens = estimateTokens(full);
      const costUsd = estimateKimiCostUsd({
        prompt_tokens: inputTokens,
        completion_tokens: outputTokens,
      });
      await insertLlmRun({
        agentName,
        model: modelUsed,
        status: "success",
        latencyMs,
        userId,
        systemPromptHash: promptHash,
        inputTokens,
        outputTokens,
        costUsd,
        errorType: null,
        errorMessage: null,
      });
      controller.close();
    },
  });

  const headers: Record<string, string> = {
    "Content-Type": "text/plain; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Accel-Buffering": "no",
  };
  if (chatId) headers["x-chat-id"] = chatId;

  return new Response(stream, { headers });
}
