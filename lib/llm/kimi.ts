// lib/llm/kimi.ts — client Hypercli (Kimi K2.6 par défaut) avec cascade automatique.
//
// Hypercli expose plusieurs modèles compatibles OpenAI SDK :
//   - kimi-k2.6 (défaut, conforme CLAUDE.md)
//   - kimi-k2.5
//   - glm-5
//   - minimax-m2.5
//
// Sprint 3.2 — Cascade avec timeout par modèle + Claude fallback :
//   Avant ce sprint, la cascade attendait infiniment sur chaque modèle. Avec
//   Hypercli lent (1 modèle pouvait prendre 5-7min), l'utilisateur attendait
//   sans visibilité. Maintenant :
//     1. Timeout MODEL_TIMEOUT_MS par modèle (AbortController)
//     2. Si timeout / 5xx / network error → fallback au modèle suivant
//     3. Si TOUS les modèles Hypercli épuisés → fallback Anthropic Claude
//        (clé ANTHROPIC_API_KEY) qui répond en 10-30s, garantissant un memo
//        en <2min total maximum.
//
// Clés env : HYPERCLI_API_KEY + ANTHROPIC_API_KEY (cf. ~/.claude/api-config/SERVICES.md).

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

export const kimi = new OpenAI({
  apiKey: process.env.HYPERCLI_API_KEY || "build-placeholder",
  baseURL: process.env.HYPERCLI_BASE_URL || "https://api.hypercli.com/v1",
  // Important : sans timeout SDK, un modèle Hypercli lent bloque
  // indéfiniment. On garde un timeout SDK global "safe" élevé,
  // et on superpose un AbortController par appel pour le vrai cap.
  timeout: 120_000,
  maxRetries: 0, // pas de retry SDK — c'est notre cascade qui gère
});

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || "build-placeholder",
  timeout: Number(process.env.LLM_CLAUDE_TIMEOUT_MS || 300_000),
  maxRetries: 0,
});

// OpenAI : 3e fallback ultime si Hypercli ET Anthropic sont KO/sans crédit.
// Crédit en général dispo et latence ~3s observée sur gpt-4o-mini.
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "build-placeholder",
  // PAS de baseURL custom — vraie API OpenAI
  timeout: 90_000,
  maxRetries: 0,
});

export const KIMI_MODEL = process.env.HYPERCLI_DEFAULT_MODEL || "kimi-k2.6";

// Timeout par modèle dans la cascade — au-delà, on bascule au suivant.
// 45s = compromis : laisse le temps à un modèle Hypercli rapide (35s mesuré
// sur kimi-k2.6 en prod), mais coupe les modèles bloqués/lents.
const MODEL_TIMEOUT_MS = Number(process.env.LLM_MODEL_TIMEOUT_MS || 45_000);

// Timeout du fallback Claude — Anthropic est en général rapide (10-30s) mais
// peut prendre plus pour un memo long.
const CLAUDE_TIMEOUT_MS = Number(process.env.LLM_CLAUDE_TIMEOUT_MS || 90_000);

// Modèle Claude utilisé en fallback — Sonnet 4.6 = bon compromis qualité/vitesse.
const CLAUDE_FALLBACK_MODEL = process.env.LLM_CLAUDE_FALLBACK_MODEL || "claude-sonnet-4-6";

// Modèle OpenAI utilisé en fallback ultime — gpt-4o = bon support response_format
// json_object, qualité mémo correcte, ~3s observé sur petits prompts.
const OPENAI_FALLBACK_MODEL = process.env.LLM_OPENAI_FALLBACK_MODEL || "gpt-4o";

// Timeout fallback OpenAI
const OPENAI_TIMEOUT_MS = Number(process.env.LLM_OPENAI_TIMEOUT_MS || 60_000);

// Prod 3-min-abort fix: the route maxDuration is 300s. With 4 models × 45s each
// (MODEL_TIMEOUT_MS default) the Hypercli budget alone could reach 180s, leaving
// only 120s for Claude — but Claude can take up to CLAUDE_TIMEOUT_MS (90s default)
// on a large memo, so the window was dangerously tight and the function aborted
// before Claude finished. By capping to 2 Hypercli models (≤ 90s budget) we
// guarantee Claude always has ≥ 180s — well within maxDuration.
//
// Budget arithmetic (defaults):
//   Hypercli:  2 models × 45s = 90s
//   Claude:    1 × 90s        = 90s
//   OpenAI:    1 × 60s        = 60s  (only if Claude also fails)
//   Total worst-case:           240s  < 300s ✓
//
// All env overrides (LLM_SKIP_HYPERCLI, LLM_MODEL_TIMEOUT_MS,
// HYPERCLI_DEFAULT_MODEL) remain fully functional — they can expand or shrink
// this chain at runtime.
const KIMI_FALLBACK_CHAIN = [
  "kimi-k2.6",
  "kimi-k2.5",
  // glm-5 and minimax-m2.5 removed from default chain — see comment above.
  // Re-enable via HYPERCLI_DEFAULT_MODEL or by extending KIMI_FALLBACK_CHAIN
  // if Hypercli latency improves significantly.
];

function buildModelChain(primary?: string): string[] {
  const head = primary || KIMI_MODEL;
  const rest = KIMI_FALLBACK_CHAIN.filter(m => m !== head);
  return [head, ...rest];
}

function isRetriable(e: any): boolean {
  if (e?.name === "AbortError") return true;
  const status = e?.status ?? e?.statusCode ?? e?.response?.status;
  if (status && status >= 500 && status < 600) return true;
  if (e?.code === "ECONNREFUSED" || e?.code === "ETIMEDOUT" || e?.code === "ENOTFOUND") return true;
  if (typeof e?.message === "string" && /Connection error|InternalServerError|aborted/i.test(e.message)) return true;
  return false;
}

/**
 * Convertit un payload OpenAI/Kimi en payload Anthropic Messages API.
 * Le memo demande response_format json_object — on traduit en "system prompt
 * + user prompt", en injectant la consigne JSON dans le system.
 */
function buildAnthropicPayload(params: any) {
  const messages = (params.messages || []) as Array<{ role: string; content: string }>;
  const systemMsgs = messages.filter(m => m.role === "system").map(m => m.content);
  const userMsgs = messages.filter(m => m.role === "user").map(m => ({ role: "user" as const, content: m.content }));
  const asstMsgs = messages.filter(m => m.role === "assistant").map(m => ({ role: "assistant" as const, content: m.content }));

  const needsJson = params?.response_format?.type === "json_object";
  const jsonGuard = needsJson
    ? "\n\nYou MUST respond with ONLY a valid JSON object. No prose, no markdown, no code fences. Begin your response immediately with { and end with }."
    : "";

  const system = [...systemMsgs, jsonGuard].filter(Boolean).join("\n\n");
  const interleaved: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const m of messages) {
    if (m.role === "user") interleaved.push({ role: "user", content: m.content });
    else if (m.role === "assistant") interleaved.push({ role: "assistant", content: m.content });
  }

  const finalMessages = interleaved.length > 0 ? interleaved : userMsgs;

  // Anthropic prefill trick: force JSON mode by prefilling the assistant turn.
  // Opus 4.x does NOT support prefill — skip it for Opus.
  const isOpusModel = CLAUDE_FALLBACK_MODEL.includes("opus");
  if (needsJson && !isOpusModel) {
    finalMessages.push({ role: "assistant", content: "{" });
  }

  const isOpus = CLAUDE_FALLBACK_MODEL.includes("opus");
  const payload: any = {
    model: CLAUDE_FALLBACK_MODEL,
    system: system || undefined,
    messages: finalMessages,
    max_tokens: Number(params.max_tokens || 8000),
  };
  // Opus 4.x: temperature is deprecated — omit it entirely
  if (!isOpus) {
    payload.temperature = typeof params.temperature === "number" ? params.temperature : 0.2;
  }
  return payload;
}

/**
 * Adapte une réponse Anthropic au format OpenAI/Kimi pour ne pas modifier
 * les callers (ils lisent response.choices[0].message.content).
 */
function adaptAnthropicResponse(resp: Anthropic.Messages.Message) {
  const text = resp.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === "text")
    .map(b => b.text)
    .join("");
  return {
    id: resp.id,
    model: resp.model,
    object: "chat.completion" as const,
    choices: [
      {
        index: 0,
        finish_reason: resp.stop_reason || "stop",
        message: { role: "assistant" as const, content: text, refusal: null },
      },
    ],
    usage: {
      prompt_tokens: resp.usage.input_tokens,
      completion_tokens: resp.usage.output_tokens,
      total_tokens: resp.usage.input_tokens + resp.usage.output_tokens,
    },
  };
}

/**
 * Tente un appel Kimi avec timeout par AbortController.
 * Throw si timeout dépassé ou si le modèle renvoie une erreur.
 */
async function attemptKimi(model: string, params: any, timeoutMs: number) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await kimi.chat.completions.create(
      { ...params, model, stream: false },
      { signal: ctrl.signal },
    );
    return response;
  } finally {
    clearTimeout(t);
  }
}

/**
 * Chat completion non-streaming avec cascade automatique :
 *   1. kimi-k2.6 (ou modèle primaire spécifié) avec timeout MODEL_TIMEOUT_MS
 *   2. kimi-k2.5 / glm-5 / minimax-m2.5 (fallbacks Hypercli)
 *   3. Claude Sonnet 4.6 (fallback final hors Hypercli)
 *
 * Renvoie la réponse au format OpenAI standard + le modèle effectivement utilisé.
 */
export async function kimiChatCompletion(
  params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream"> & { stream?: false },
) {
  const chain = buildModelChain(params.model);
  let lastError: any;
  const overallStart = Date.now();

  // Cascade Hypercli — skip si LLM_SKIP_HYPERCLI=1 (ex : quota épuisé)
  const skipHypercli = process.env.LLM_SKIP_HYPERCLI === "1";

  for (const model of skipHypercli ? [] : chain) {
    const stepStart = Date.now();
    try {
      const response = await attemptKimi(model, params, MODEL_TIMEOUT_MS);
      const elapsed = Date.now() - stepStart;
      console.log(`[kimi] ${model} succeeded in ${elapsed}ms`);
      return { response, model_used: model };
    } catch (e) {
      const elapsed = Date.now() - stepStart;
      lastError = e;
      const status = (e as any)?.status || (e as any)?.code || "unknown";
      if (!isRetriable(e)) {
        console.error(`[kimi] ${model} non-retriable error after ${elapsed}ms (status=${status}): ${(e as any)?.message}`);
        throw e;
      }
      console.warn(`[kimi] ${model} failed after ${elapsed}ms (status=${status}), trying next fallback...`);
    }
  }

  // Fallback final Anthropic Claude
  if (process.env.ANTHROPIC_API_KEY) {
    const stepStart = Date.now();
    try {
      console.warn(`[kimi] all Hypercli models exhausted in ${Date.now() - overallStart}ms, falling back to Claude ${CLAUDE_FALLBACK_MODEL}`);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), CLAUDE_TIMEOUT_MS);
      try {
        const anthropicPayload = buildAnthropicPayload(params);
        const anthropicResp = await anthropic.messages.create(anthropicPayload, { signal: ctrl.signal });
        const adapted = adaptAnthropicResponse(anthropicResp);
        // Re-inject the prefill `{` if we used the JSON prefill trick
        const usedPrefill = params?.response_format?.type === "json_object";
        if (usedPrefill && adapted.choices?.[0]?.message?.content) {
          const c = adapted.choices[0].message.content;
          if (!c.trimStart().startsWith("{")) {
            adapted.choices[0].message.content = "{" + c;
          }
        }
        const elapsed = Date.now() - stepStart;
        console.log(`[kimi] claude fallback succeeded in ${elapsed}ms`);
        return { response: adapted as any, model_used: CLAUDE_FALLBACK_MODEL };
      } finally {
        clearTimeout(t);
      }
    } catch (e) {
      console.error(`[kimi] claude fallback also failed: ${(e as any)?.message}`);
      lastError = e;
    }
  } else {
    console.warn(`[kimi] no ANTHROPIC_API_KEY set, skipping Claude fallback`);
  }

  // Fallback ultime OpenAI — désactivé si LLM_SKIP_OPENAI=1
  if (process.env.OPENAI_API_KEY && process.env.LLM_SKIP_OPENAI !== "1") {
    const stepStart = Date.now();
    try {
      console.warn(`[kimi] Claude fallback also failed, trying OpenAI ${OPENAI_FALLBACK_MODEL}`);
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), OPENAI_TIMEOUT_MS);
      try {
        const openaiResp = await openai.chat.completions.create(
          { ...params, model: OPENAI_FALLBACK_MODEL, stream: false },
          { signal: ctrl.signal },
        );
        const elapsed = Date.now() - stepStart;
        console.log(`[kimi] openai fallback succeeded in ${elapsed}ms`);
        return { response: openaiResp, model_used: OPENAI_FALLBACK_MODEL };
      } finally {
        clearTimeout(t);
      }
    } catch (e) {
      console.error(`[kimi] openai fallback also failed: ${(e as any)?.message}`);
      lastError = e;
    }
  } else {
    console.warn(`[kimi] no OPENAI_API_KEY set, skipping OpenAI fallback`);
  }

  throw lastError;
}

/**
 * Chat completion streaming avec cascade automatique sur 5xx.
 * (Conserve l'ancien comportement sans timeout pour ne pas casser les callers
 * existants — à upgrader si besoin futur.)
 */
export async function kimiChatStream(
  params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream">,
) {
  const chain = buildModelChain(params.model);
  const skipHypercli = process.env.LLM_SKIP_HYPERCLI === "1";
  let lastError: any;

  for (const model of skipHypercli ? [] : chain) {
    try {
      const stream = await kimi.chat.completions.create({ ...params, model, stream: true });
      return { stream, model_used: model };
    } catch (e) {
      lastError = e;
      if (!isRetriable(e)) throw e;
      console.warn(`[kimi-stream] ${model} failed (${(e as any)?.status || "?"}), trying next fallback...`);
    }
  }

  // Fallback Claude — via OpenAI-compat wrapper (openai SDK → Anthropic baseURL non dispo,
  // on passe par kimiChatCompletion non-streaming et on l'enveloppe en stream synthétique)
  if (process.env.ANTHROPIC_API_KEY) {
    console.warn(`[kimi-stream] falling back to Claude ${CLAUDE_FALLBACK_MODEL} (non-streaming)`);
    const { response, model_used } = await kimiChatCompletion(params as any);
    const text = response.choices?.[0]?.message?.content ?? "";
    // Synthétise un stream OpenAI-compatible à partir de la réponse complète
    async function* syntheticStream() {
      yield { choices: [{ delta: { content: text }, finish_reason: null }] };
      yield { choices: [{ delta: {}, finish_reason: "stop" }] };
    }
    return { stream: syntheticStream() as any, model_used };
  }

  throw lastError ?? new Error("No LLM available");
}
