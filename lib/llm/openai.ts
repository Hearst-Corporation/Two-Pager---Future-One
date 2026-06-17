// lib/llm/openai.ts — client OpenAI officiel (GPT-4.1 mémo).
//
// Clés env : OPENAI_API_KEY (requis), OPENAI_BASE_URL (optionnel),
// OPENAI_MEMO_MODEL (défaut gpt-4.1).

import * as Sentry from "@sentry/nextjs";
import OpenAI from "openai";
import { LLM_MEMO_MODEL, LLM_SDK_TIMEOUT_MS } from "../constants";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "build-placeholder",
  baseURL: process.env.OPENAI_BASE_URL || undefined,
  timeout: Number(process.env.LLM_MODEL_TIMEOUT_MS ?? LLM_SDK_TIMEOUT_MS),
  maxRetries: 0,
});

/** Génération mémo stratégique — JSON structuré */
export const OPENAI_MEMO_MODEL = process.env.OPENAI_MEMO_MODEL || LLM_MEMO_MODEL;

type ChatParams = Omit<
  Parameters<typeof openai.chat.completions.create>[0],
  "stream"
> & { stream?: false };

export async function openaiChatCompletion(params: ChatParams) {
  const model = (params.model as string) || OPENAI_MEMO_MODEL;
  const start = Date.now();
  const response = await openai.chat.completions.create({
    ...params,
    model,
    stream: false,
  });
  Sentry.addBreadcrumb({
    category: "llm.openai",
    level: "info",
    message: `${model} succeeded`,
    data: { model, duration_ms: Date.now() - start },
  });
  return { response, model_used: model };
}
