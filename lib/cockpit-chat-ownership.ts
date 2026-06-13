import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Returns true when chatId belongs to userId. Throws on DB error.
 * Used by cockpit-chat route before service_role reads/writes on cockpit_messages.
 */
export async function userOwnsChat(
  supa: SupabaseClient,
  chatId: string,
  userId: string,
): Promise<boolean> {
  const { data, error } = await supa
    .from("cockpit_chats")
    .select("id")
    .eq("id", chatId)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return !!data;
}
