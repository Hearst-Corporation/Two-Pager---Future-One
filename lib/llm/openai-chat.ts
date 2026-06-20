// lib/llm/openai-chat.ts — client OpenAI officiel (SDK `openai`) pour le chat
// Cockpit (rail droit / Assistant ORACLE).
//
// Chat conseiller Investment Committee : OpenAI GPT, SANS fallback. Si l'appel
// échoue (timeout, 5xx, quota), il échoue. Pas de Kimi/Moonshot ici.
//
// Deux modèles branchés :
//   - gpt-4.1 (DÉFAUT) — meilleur suivi d'instructions sur les prompts longs
//     ORACLE (couche constitutionnelle + grounding deal), contexte large, texte.
//   - gpt-4o — alternative multimodale/rapide, sélectionnable dans les réglages.
//
// Clés env : OPENAI_API_KEY, OPENAI_CHAT_MODEL (défaut gpt-4.1).

import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "build-placeholder",
  timeout: Number(process.env.LLM_MODEL_TIMEOUT_MS || 300_000),
  maxRetries: 2,
});

// Modèles autorisés côté serveur (whitelist pour l'override venu des réglages).
export const CHAT_MODELS = ["gpt-4.1", "gpt-4o"] as const;
export type ChatModel = (typeof CHAT_MODELS)[number];

export const DEFAULT_CHAT_MODEL: ChatModel =
  (process.env.OPENAI_CHAT_MODEL as ChatModel) || "gpt-4.1";

/** Constante nommée pour max_tokens du chat — évite les magic numbers dispersés. */
export const CHAT_MAX_TOKENS = 4096;

/** Résout le modèle demandé contre la whitelist ; sinon retombe sur le défaut. */
export function resolveChatModel(requested?: string | null): ChatModel {
  if (requested && (CHAT_MODELS as readonly string[]).includes(requested)) {
    return requested as ChatModel;
  }
  return DEFAULT_CHAT_MODEL;
}

// Tarifs USD par million de tokens (pour l'estimation de coût loggée).
const PRICING_USD_PER_MTOK: Record<ChatModel, { input: number; output: number }> = {
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4o": { input: 2.5, output: 10.0 },
};

export function estimateGptCostUsd(
  model: string,
  promptTokens: number,
  completionTokens: number,
): number {
  const p = PRICING_USD_PER_MTOK[(model as ChatModel)] ?? PRICING_USD_PER_MTOK["gpt-4.1"];
  return (promptTokens / 1_000_000) * p.input + (completionTokens / 1_000_000) * p.output;
}

/**
 * Streaming chat — OpenAI GPT, SANS fallback.
 * Renvoie le stream OpenAI standard + le modèle effectivement utilisé.
 */
export async function openaiChatStream(
  params: Omit<Parameters<typeof openai.chat.completions.create>[0], "stream">,
) {
  const model = (params.model as string) || DEFAULT_CHAT_MODEL;
  const stream = await openai.chat.completions.create({ ...params, model, stream: true });
  return { stream, model_used: model };
}

/**
 * Completion non-streamée — OpenAI GPT, SANS fallback.
 * Renvoie la réponse OpenAI standard + le modèle effectivement utilisé.
 */
export async function openaiChatCompletion(
  params: Omit<Parameters<typeof openai.chat.completions.create>[0], "stream"> & { stream?: false },
) {
  const model = (params.model as string) || DEFAULT_CHAT_MODEL;
  const start = Date.now();
  const response = await openai.chat.completions.create({ ...params, model, stream: false });
  console.log(`[openai-chat] ${model} succeeded in ${Date.now() - start}ms`);
  return { response, model_used: model };
}
