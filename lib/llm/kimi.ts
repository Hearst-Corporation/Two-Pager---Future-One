// lib/llm/kimi.ts — client Hypercli (Kimi K2.6 par défaut) avec cascade automatique.
//
// Hypercli expose plusieurs modèles compatibles OpenAI SDK :
//   - kimi-k2.6 (défaut, conforme CLAUDE.md)
//   - kimi-k2.5
//   - glm-5
//   - minimax-m2.5
//
// Quand le modèle primaire renvoie 5xx (panne infra Hypercli vue le 28/05),
// la cascade essaie automatiquement les fallbacks dans l'ordre. La clé est
// HYPERCLI_API_KEY (cf. ~/.claude/api-config/SERVICES.md). Jamais hardcoder.

import OpenAI from "openai";

export const kimi = new OpenAI({
  apiKey: process.env.HYPERCLI_API_KEY || "build-placeholder",
  baseURL: process.env.HYPERCLI_BASE_URL || "https://api.hypercli.com/v1",
});

export const KIMI_MODEL = process.env.HYPERCLI_DEFAULT_MODEL || "kimi-k2.6";

const KIMI_FALLBACK_CHAIN = [
  "kimi-k2.6",
  "kimi-k2.5",
  "glm-5",
  "minimax-m2.5",
];

function buildModelChain(primary?: string): string[] {
  const head = primary || KIMI_MODEL;
  const rest = KIMI_FALLBACK_CHAIN.filter(m => m !== head);
  return [head, ...rest];
}

function isRetriable(e: any): boolean {
  const status = e?.status ?? e?.statusCode ?? e?.response?.status;
  if (status && status >= 500 && status < 600) return true;
  // Connection / DNS / timeout errors don't always carry a status — retry too.
  if (e?.code === "ECONNREFUSED" || e?.code === "ETIMEDOUT" || e?.code === "ENOTFOUND") return true;
  if (typeof e?.message === "string" && /Connection error|InternalServerError/i.test(e.message)) return true;
  return false;
}

/**
 * Chat completion non-streaming avec cascade automatique sur 5xx.
 * Renvoie la réponse OpenAI standard + le modèle effectivement utilisé.
 *
 * Usage:
 *   const { response, model_used } = await kimiChatCompletion({ messages, tools });
 */
export async function kimiChatCompletion(params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream"> & { stream?: false }) {
  const chain = buildModelChain(params.model);
  let lastError: any;
  for (const model of chain) {
    try {
      const response = await kimi.chat.completions.create({ ...params, model, stream: false });
      return { response, model_used: model };
    } catch (e) {
      lastError = e;
      if (!isRetriable(e)) throw e;
      console.warn(`[kimi] ${model} failed (${(e as any)?.status || "?"}), trying next fallback...`);
    }
  }
  throw lastError;
}

/**
 * Chat completion streaming avec cascade automatique sur 5xx.
 * Renvoie l'iterable async + le modèle effectivement utilisé.
 *
 * Note: la cascade est tentée à la création du stream uniquement. Si le stream
 * casse en cours d'envoi, l'erreur remonte au caller (pas de re-stream).
 */
export async function kimiChatStream(params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream">) {
  const chain = buildModelChain(params.model);
  let lastError: any;
  for (const model of chain) {
    try {
      const stream = await kimi.chat.completions.create({ ...params, model, stream: true });
      return { stream, model_used: model };
    } catch (e) {
      lastError = e;
      if (!isRetriable(e)) throw e;
      console.warn(`[kimi-stream] ${model} failed (${(e as any)?.status || "?"}), trying next fallback...`);
    }
  }
  throw lastError;
}
