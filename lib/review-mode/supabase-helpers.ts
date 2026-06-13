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

export async function setAdminChatMode(userId: string, mode: Mode): Promise<void> {
  const supa = getPublicAdminClient();
  const { error } = await supa
    .from("admin_chat_mode")
    .upsert(
      { user_id: userId, mode, updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}

// ────────────────────────────────────────────────────────────────────────────
// review_documents
// ────────────────────────────────────────────────────────────────────────────

export interface InsertReviewDocumentArgs {
  userId: string;
  chatId: string;
  contentMd: string;
  contentJson: unknown | null;
}

export async function insertReviewDocument(args: InsertReviewDocumentArgs): Promise<{ id: string }> {
  const supa = getPublicAdminClient();
  const { data, error } = await supa
    .from("review_documents")
    .insert({
      user_id: args.userId,
      chat_id: args.chatId,
      content_md: args.contentMd,
      content_json: args.contentJson,
    })
    .select("id")
    .single();
  if (error) throw error;
  return { id: data.id as string };
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

// ────────────────────────────────────────────────────────────────────────────
// cockpit_messages — review-mode filtered loader
// ────────────────────────────────────────────────────────────────────────────

export interface ReviewMessage {
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

/**
 * Loads only the messages stamped with mode='review' for a given chat,
 * ordered chronologically. Used by /api/admin/review-document to build the
 * transcript fed to the LLM when generating the final document.
 */
export async function loadReviewMessages(chatId: string): Promise<ReviewMessage[]> {
  const supa = getPublicAdminClient();
  const { data, error } = await supa
    .from("cockpit_messages")
    .select("role, content, created_at")
    .eq("chat_id", chatId)
    .eq("mode", "review")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as ReviewMessage[];
}

/**
 * Resolves the most recent cockpit_chat for a user that has at least one
 * message stamped with mode='review'. Used as a fallback by the review-document
 * route when the client doesn't know the active chatId (cockpit-shell does not
 * expose it). Returns null if no such chat exists.
 */
export async function findLatestReviewChatId(userId: string): Promise<string | null> {
  const supa = getPublicAdminClient();
  // Get review-mode messages ordered most recent first, look up their chat,
  // filter by user owning the chat (RLS-style done in SQL).
  const { data, error } = await supa
    .from("cockpit_messages")
    .select("chat_id, created_at, cockpit_chats!inner(user_id)")
    .eq("mode", "review")
    .eq("cockpit_chats.user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1);
  if (error) {
    console.warn("[findLatestReviewChatId]", error.message);
    return null;
  }
  const first = (data ?? [])[0];
  return (first?.chat_id as string | undefined) ?? null;
}
