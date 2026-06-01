// lib/llm/kimi.ts — client Hypercli, Kimi K2.6.
//
// Génération de mémo : Kimi K2.6 via Hypercli UNIQUEMENT — AUCUN fallback.
// Si Hypercli/Kimi échoue (timeout, 5xx, quota épuisé), l'appel échoue. Pas de
// filet : ni cascade Hypercli (k2.5/glm-5/minimax), ni Claude, ni OpenAI.
//
// Clés env : HYPERCLI_API_KEY.

import OpenAI from "openai";

export const kimi = new OpenAI({
  apiKey: process.env.HYPERCLI_API_KEY || "build-placeholder",
  baseURL: process.env.HYPERCLI_BASE_URL || "https://api.hypercli.com/v1",
  timeout: Number(process.env.LLM_MODEL_TIMEOUT_MS || 300_000),
  maxRetries: 0,
});

export const KIMI_MODEL = process.env.HYPERCLI_DEFAULT_MODEL || "kimi-k2.6";

/**
 * Génération mémo — Kimi K2.6 via Hypercli, SANS fallback.
 * Renvoie la réponse OpenAI standard + le modèle effectivement utilisé.
 * Throw direct si l'appel Hypercli échoue.
 */
export async function kimiChatCompletion(
  params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream"> & { stream?: false },
) {
  const model = (params.model as string) || KIMI_MODEL;
  const start = Date.now();
  const response = await kimi.chat.completions.create({ ...params, model, stream: false });
  console.log(`[kimi] ${model} succeeded in ${Date.now() - start}ms`);
  return { response, model_used: model };
}

/**
 * Streaming — Kimi K2.6 via Hypercli, SANS fallback.
 */
export async function kimiChatStream(
  params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream">,
) {
  const model = (params.model as string) || KIMI_MODEL;
  const stream = await kimi.chat.completions.create({ ...params, model, stream: true });
  return { stream, model_used: model };
}
