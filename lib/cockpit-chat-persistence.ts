import type { ChatMessage, ChatPersistence } from "@hearst/cockpit-shell";
import { getServerClient } from "@/lib/supabase-server";

const rowToMessage = (row: {
  id: string;
  role: string;
  content: string;
  created_at: string | null;
}): ChatMessage => ({
  id: row.id,
  role: row.role === "assistant" ? "assistant" : "user",
  content: row.content,
  createdAt: row.created_at ? Date.parse(row.created_at) : Date.now(),
});

export const cockpitChatPersistence: ChatPersistence = {
  async loadMessages(chatId) {
    const supa = getServerClient();
    const { data, error } = await supa
      .from("cockpit_messages")
      .select("id, role, content, created_at")
      .eq("chat_id", chatId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToMessage);
  },

  async saveMessage(chatId, msg) {
    const supa = getServerClient();
    const { error } = await supa.from("cockpit_messages").insert({
      id: msg.id,
      chat_id: chatId,
      role: msg.role,
      content: msg.content,
    });
    if (error) throw error;
  },

  async createChat() {
    const supa = getServerClient();
    const { data: { user } } = await supa.auth.getUser();
    if (!user) throw new Error("cockpit-chat: not authenticated");
    const { data, error } = await supa
      .from("cockpit_chats")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (error) throw error;
    return data.id as string;
  },
};
