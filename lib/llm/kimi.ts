// lib/llm/kimi.ts — client Moonshot AI (éditeur officiel Kimi), Kimi K2.6.
//
// Génération de mémo : Kimi K2.6 via Moonshot AI UNIQUEMENT — AUCUN fallback.
// Si Moonshot/Kimi échoue (timeout, 5xx, quota épuisé), l'appel échoue. Pas de
// filet : ni Claude, ni OpenAI.
//
// Clés env : MOONSHOT_API_KEY, MOONSHOT_BASE_URL, KIMI_MODEL.
//
// CAVEAT reasoning_content : kimi-k2.6 est un modèle à raisonnement. Le thinking
// arrive dans delta.reasoning_content (champ séparé), la réponse finale dans
// delta.content. Le stream ne consomme QUE delta.content — reasoning_content est
// ignoré naturellement (champ non lu). max_tokens doit être large (≥4096) sinon
// delta.content peut rester vide.

import OpenAI from "openai";

export const kimi = new OpenAI({
  apiKey: process.env.MOONSHOT_API_KEY || "build-placeholder",
  baseURL: process.env.MOONSHOT_BASE_URL || "https://api.moonshot.ai/v1",
  timeout: Number(process.env.LLM_MODEL_TIMEOUT_MS || 300_000),
  maxRetries: 0,
});

export const KIMI_MODEL = process.env.KIMI_MODEL || "kimi-k2.6";

/**
 * Génération mémo — Kimi K2.6 via Moonshot AI, SANS fallback.
 * Renvoie la réponse OpenAI standard + le modèle effectivement utilisé.
 * Throw direct si l'appel Moonshot échoue.
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
 * Streaming — Kimi K2.6 via Moonshot AI, SANS fallback.
 * Consomme delta.content uniquement ; delta.reasoning_content ignoré.
 */
export async function kimiChatStream(
  params: Omit<Parameters<typeof kimi.chat.completions.create>[0], "stream">,
) {
  const model = (params.model as string) || KIMI_MODEL;
  const stream = await kimi.chat.completions.create({ ...params, model, stream: true });
  return { stream, model_used: model };
}
