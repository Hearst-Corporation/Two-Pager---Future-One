// lib/review-mode/user-tuning.ts
//
// RAG-style user tuning preferences for the chat.
//
// The chat lets the user say "réponds plus court", "passe en anglais",
// "cite toujours la source_id"… via `/pref <instruction>` slash commands.
// Each command writes a row to `oracle_user_tuning`. On every subsequent
// request the chat route loads the user's active rules and prepends
// them to the system prompt (under "## PRÉFÉRENCES UTILISATEUR ACTIVES").
//
// This is RETRIEVAL-based: rules are fetched at request time, never baked
// into model memory. The user can list, drop, or wipe them at will.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface TuningRow {
  id: string;
  instruction: string;
  created_at: string;
}

function getClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function listActiveTunings(userId: string): Promise<TuningRow[]> {
  const { data, error } = await getClient()
    .from("oracle_user_tuning")
    .select("id, instruction, created_at")
    .eq("user_id", userId)
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[tuning list]", error.message);
    return [];
  }
  return (data ?? []) as TuningRow[];
}

export async function addTuning(userId: string, instruction: string): Promise<TuningRow | null> {
  const clean = instruction.trim();
  if (!clean) return null;
  if (clean.length > 500) return null; // hard cap
  const { data, error } = await getClient()
    .from("oracle_user_tuning")
    .insert({ user_id: userId, instruction: clean })
    .select("id, instruction, created_at")
    .single();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[tuning add]", error.message);
    return null;
  }
  return data as TuningRow;
}

export async function removeTuningByShortId(
  userId: string,
  shortId: string,
): Promise<boolean> {
  const trimmed = shortId.trim().toLowerCase();
  if (!trimmed) return false;
  // Match the first 8 chars of the uuid for ergonomics. Use a prefix LIKE.
  const { error, count } = await getClient()
    .from("oracle_user_tuning")
    .delete({ count: "exact" })
    .eq("user_id", userId)
    .ilike("id", `${trimmed}%`);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[tuning remove]", error.message);
    return false;
  }
  return (count ?? 0) > 0;
}

export async function clearTunings(userId: string): Promise<number> {
  const { error, count } = await getClient()
    .from("oracle_user_tuning")
    .delete({ count: "exact" })
    .eq("user_id", userId);
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[tuning clear]", error.message);
    return 0;
  }
  return count ?? 0;
}

/**
 * Build the system-prompt block that contains the user's active tuning rules.
 * Returns an empty string if no rules are active so the baseline prompt is
 * untouched.
 */
export function renderTuningBlock(tunings: TuningRow[]): string {
  if (!tunings.length) return "";
  const lines = tunings.map((t, i) => `${i + 1}. (id ${t.id.slice(0, 8)}) ${t.instruction}`);
  return [
    "",
    "## PRÉFÉRENCES UTILISATEUR ACTIVES (à respecter en priorité — l'utilisateur les a définies via /pref)",
    ...lines,
    "Si une préférence contredit le baseline, la préférence utilisateur PRIME (sauf garde-fous de sécurité / interdictions absolues).",
    "",
  ].join("\n");
}

// ────────────────────────────────────────────────────────────────────────────
// Slash-command parser
// ────────────────────────────────────────────────────────────────────────────

export type TuningCommand =
  | { kind: "add"; instruction: string }
  | { kind: "list" }
  | { kind: "clear" }
  | { kind: "remove"; shortId: string }
  | { kind: "help" };

/**
 * Parse the user's first message line for a tuning slash command.
 * Returns null if it's a normal chat message.
 *
 * Accepted forms (case-insensitive on the verb):
 *   /pref <texte>                   → add
 *   /préf <texte>                   → add (alias)
 *   /tune <texte>                   → add (alias)
 *   /règles                         → list
 *   /regles                         → list (no diacritics)
 *   /preferences                    → list
 *   /préférences                    → list
 *   /pref list                      → list (alias)
 *   /pref clear                     → clear
 *   /oublie tout                    → clear
 *   /oublie <shortId>               → remove specific
 *   /pref rm <shortId>              → remove (alias)
 *   /pref help                      → help
 */
export function parseTuningCommand(message: string): TuningCommand | null {
  const trimmed = message.trim();
  if (!trimmed.startsWith("/")) return null;
  const lower = trimmed.toLowerCase();

  // List commands
  if (
    lower === "/règles" ||
    lower === "/regles" ||
    lower === "/preferences" ||
    lower === "/préférences" ||
    lower === "/pref list" ||
    lower === "/préf list" ||
    lower === "/tune list"
  ) {
    return { kind: "list" };
  }

  // Help
  if (lower === "/pref" || lower === "/préf" || lower === "/tune" || lower === "/pref help") {
    return { kind: "help" };
  }

  // Clear commands
  if (lower === "/pref clear" || lower === "/préf clear" || lower === "/oublie tout" || lower === "/tune clear") {
    return { kind: "clear" };
  }

  // Remove by id : /oublie <id> or /pref rm <id>
  const oublieMatch = trimmed.match(/^\/oublie\s+([0-9a-f-]{4,})$/i);
  if (oublieMatch) return { kind: "remove", shortId: oublieMatch[1] };
  const rmMatch = trimmed.match(/^\/(?:pref|préf|tune)\s+rm\s+([0-9a-f-]{4,})$/i);
  if (rmMatch) return { kind: "remove", shortId: rmMatch[1] };

  // Add : /pref <texte>  /préf <texte>  /tune <texte>
  const addMatch = trimmed.match(/^\/(?:pref|préf|tune)\s+(.+)$/i);
  if (addMatch) {
    const instruction = addMatch[1].trim();
    if (instruction) return { kind: "add", instruction };
  }

  return null;
}

export function helpText(): string {
  return [
    "Commandes de tuning Oracle (RAG, scope utilisateur) :",
    "",
    "- \`/pref <instruction>\` — ajoute une règle. Ex: \`/pref réponds en anglais\`, \`/pref toujours cite le source_id\`.",
    "- \`/règles\` — liste les règles actives avec leur identifiant court.",
    "- \`/oublie <id>\` — supprime une règle. Ex: \`/oublie a3f1\`.",
    "- \`/oublie tout\` — supprime toutes les règles actives.",
    "",
    "Les règles s'appliquent aux DEUX modes (Conversation et Review). Elles persistent jusqu'à suppression — pas de mémoire conversationnelle, juste du RAG.",
  ].join("\n");
}
