// lib/review-mode/supabase-helpers.ts
//
// Thin Supabase wrappers used by the review-mode API routes. We deliberately
// keep these inline-typed (no .d.ts generation step) — they hit three tables:
//   - public.admin_chat_mode
//   - public.review_documents
//   - public.llm_runs
// plus a filtered read of public.cockpit_messages (only review-mode rows).

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

type Mode = "normal" | "review";

function getPublicAdminClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ────────────────────────────────────────────────────────────────────────────
// admin_chat_mode
// ────────────────────────────────────────────────────────────────────────────

export async function getAdminChatMode(userId: string): Promise<Mode> {
  const supa = getPublicAdminClient();
  const { data, error } = await supa
    .from("admin_chat_mode")
    .select("mode")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  const mode = (data?.mode as Mode | undefined) ?? "normal";
  return mode === "review" ? "review" : "normal";
}

// ────────────────────────────────────────────────────────────────────────────
// llm_runs
// ────────────────────────────────────────────────────────────────────────────

export interface InsertLlmRunArgs {
  agentName: string;
  model: string;
  status: "success" | "failed" | "timeout";
  latencyMs: number;
  userId: string | null;
  systemPromptHash: string;
  inputTokens: number | null;
  outputTokens: number | null;
  costUsd: number | null;
  errorType: string | null;
  errorMessage: string | null;
}

export async function insertLlmRun(args: InsertLlmRunArgs): Promise<void> {
  const supa = getPublicAdminClient();
  const { error } = await supa.from("llm_runs").insert({
    agent_name: args.agentName,
    model: args.model,
    status: args.status,
    latency_ms: args.latencyMs,
    user_id: args.userId,
    system_prompt_hash: args.systemPromptHash,
    input_tokens: args.inputTokens,
    output_tokens: args.outputTokens,
    cost_usd: args.costUsd,
    error_type: args.errorType,
    error_message: args.errorMessage,
  });
  if (error) {
    // Never fail the request because observability insert failed — log and move on.
    console.warn("[llm_runs insert failed]", error.message);
  }
}

