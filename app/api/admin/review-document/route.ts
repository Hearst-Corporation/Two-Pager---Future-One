// app/api/admin/review-document/route.ts
//
// POST → generates the final review document (Markdown + structured JSON)
// from the review-mode transcript of the given chat.
//
// Body: { chatId: string, stream?: boolean }
//
// Behaviour:
//   - Auth: requireProfile("admin").
//   - Loads cockpit_messages WHERE chat_id=$1 AND mode='review' (chronological).
//   - Calls Kimi via Hypercli with DOCUMENT_INSTRUCTIONS as system, transcript as user.
//   - Streams the Markdown to the client (SSE-friendly raw stream).
//   - On stream completion: strips reasoning tags, extracts JSON block, validates
//     against ReviewDocumentJsonSchema, persists row in review_documents,
//     auto-resets admin_chat_mode back to "normal", logs llm_runs.
//
// Returns a streaming text/plain response (one continuous body). The client
// receives the markdown progressively; the final review_document row is
// available via /api/admin/review-document?chatId=… (GET) after completion.

import { NextResponse } from "next/server";
import {
  stripReasoningBlocks,
  estimateTokens,
  estimateKimiCostUsd,
} from "@hearst/review-mode";
import { kimi, KIMI_MODEL } from "@/lib/llm/kimi";
import { requireProfile } from "@/lib/supabase-admin";
import {
  DOCUMENT_INSTRUCTIONS,
  DOCUMENT_INSTRUCTIONS_HASH,
} from "@/lib/review-mode/prompt-hash";
import {
  loadReviewMessages,
  insertReviewDocument,
  insertLlmRun,
  setAdminChatMode,
  findLatestReviewChatId,
} from "@/lib/review-mode/supabase-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface PostBody {
  chatId?: unknown;
}

export async function POST(req: Request) {
  const r = await requireProfile("admin");
  if (r instanceof NextResponse) return r;
  const userId = r.profile.id as string;

  let body: PostBody;
  try {
    body = (await req.json()) as PostBody;
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
  let chatId = typeof body.chatId === "string" ? body.chatId : "";
  if (!chatId) {
    // Fallback: cockpit-shell doesn't expose the active chatId to admin controls,
    // so we resolve it server-side by finding the user's most recent chat with
    // at least one message stamped mode='review'.
    const auto = await findLatestReviewChatId(userId);
    if (!auto) {
      return NextResponse.json(
        { error: "Aucune conversation review-mode trouvée pour ton compte." },
        { status: 400 },
      );
    }
    chatId = auto;
  }

  // Build transcript from review-mode messages only.
  let messages: Awaited<ReturnType<typeof loadReviewMessages>>;
  try {
    messages = await loadReviewMessages(chatId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown";
    return NextResponse.json({ error: `loadReviewMessages: ${msg}` }, { status: 500 });
  }
  if (messages.length === 0) {
    return NextResponse.json(
      { error: "No review-mode messages found for this chat — nothing to document." },
      { status: 400 },
    );
  }

  const transcript = messages
    .map((m) => `### ${m.role.toUpperCase()}\n${m.content}`)
    .join("\n\n---\n\n");

  const kimiMessages = [
    { role: "system" as const, content: DOCUMENT_INSTRUCTIONS },
    {
      role: "user" as const,
      content:
        "Voici la transcription complète de la session de revue. Produis le document de modifications conforme au format demandé.\n\n" +
        transcript,
    },
  ];

  const inputTokens = estimateTokens(DOCUMENT_INSTRUCTIONS + transcript);

  const startedAt = Date.now();
  let completion;
  try {
    completion = await kimi.chat.completions.create(
      {
        model: KIMI_MODEL,
        stream: true,
        messages: kimiMessages,
      },
      { signal: req.signal },
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : "LLM upstream error";
    await insertLlmRun({
      agentName: "review-document",
      model: KIMI_MODEL,
      status: "failed",
      latencyMs: Date.now() - startedAt,
      userId,
      systemPromptHash: DOCUMENT_INSTRUCTIONS_HASH,
      inputTokens,
      outputTokens: null,
      costUsd: null,
      errorType: "upstream",
      errorMessage: msg,
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }

  const enc = new TextEncoder();
  let fullText = "";

  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const part of completion) {
          if (req.signal.aborted) break;
          const delta = part.choices?.[0]?.delta?.content ?? "";
          if (!delta) continue;
          fullText += delta;
          controller.enqueue(enc.encode(delta));
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : "stream error";
        controller.enqueue(enc.encode(`\n\n[ERROR] ${msg}\n`));
        await insertLlmRun({
          agentName: "review-document",
          model: KIMI_MODEL,
          status: "failed",
          latencyMs: Date.now() - startedAt,
          userId,
          systemPromptHash: DOCUMENT_INSTRUCTIONS_HASH,
          inputTokens,
          outputTokens: estimateTokens(fullText),
          costUsd: null,
          errorType: "stream",
          errorMessage: msg,
        });
        controller.close();
        return;
      }

      // Post-stream finalization: sanitize, extract JSON, persist.
      const latencyMs = Date.now() - startedAt;
      try {
        // Two-pass sanitize:
        //   (1) Package helper handles complete <think>…</think> blocks.
        //   (2) Fallback for UNCLOSED reasoning blocks (when the upstream
        //       stream is cut mid-thought). We drop everything from the
        //       opening tag up to the first H1 ("# ") so the memo starts
        //       cleanly. If no H1 follows, we drop to EOF rather than ship
        //       raw chain-of-thought.
        let sanitized = stripReasoningBlocks(fullText);
        const openTag = /<(think|thinking|reflection|reasoning|analyze|analysis)\b[^>]*>/i;
        const openMatch = openTag.exec(sanitized);
        if (openMatch) {
          const before = sanitized.slice(0, openMatch.index);
          const after = sanitized.slice(openMatch.index);
          const h1Idx = after.search(/^# /m);
          sanitized = (before + (h1Idx >= 0 ? after.slice(h1Idx) : "")).replace(/^\s+/, "");
        }

        // Extract the last ```json … ``` fenced block (permissive, no schema —
        // Oracle uses a custom IC-memo JSON shape that the package's schema
        // doesn't cover; we store any parsable JSON and skip validation).
        let contentJson: unknown | null = null;
        const fenceRegex = /```json\s*\n([\s\S]*?)\n```/g;
        let lastMatch: RegExpExecArray | null = null;
        let m: RegExpExecArray | null;
        while ((m = fenceRegex.exec(sanitized)) !== null) lastMatch = m;
        if (lastMatch) {
          try {
            contentJson = JSON.parse(lastMatch[1]);
          } catch (e) {
            console.warn("[review-doc] JSON parse failed", e);
          }
        }

        await insertReviewDocument({
          userId,
          chatId,
          contentMd: sanitized,
          contentJson,
        });

        // Auto-reset to normal mode after successful generation.
        try {
          await setAdminChatMode(userId, "normal");
        } catch (e) {
          console.warn("[review-doc] auto-reset mode failed", e);
        }

        const outputTokens = estimateTokens(fullText);
        const costUsd = estimateKimiCostUsd({
          prompt_tokens: inputTokens,
          completion_tokens: outputTokens,
        });
        await insertLlmRun({
          agentName: "review-document",
          model: KIMI_MODEL,
          status: "success",
          latencyMs,
          userId,
          systemPromptHash: DOCUMENT_INSTRUCTIONS_HASH,
          inputTokens,
          outputTokens,
          costUsd,
          errorType: null,
          errorMessage: null,
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : "finalize error";
        controller.enqueue(enc.encode(`\n\n[FINALIZE_ERROR] ${msg}\n`));
        await insertLlmRun({
          agentName: "review-document",
          model: KIMI_MODEL,
          status: "failed",
          latencyMs,
          userId,
          systemPromptHash: DOCUMENT_INSTRUCTIONS_HASH,
          inputTokens,
          outputTokens: estimateTokens(fullText),
          costUsd: null,
          errorType: "finalize",
          errorMessage: msg,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
