// app/api/cockpit-chats/[chatId]/route.ts
//
// Endpoints consumed by @hearst/cockpit-shell when no `persistence` is
// configured. The shell calls these to restore chat history on mount and to
// let the user delete a conversation from the history panel.
//
// GET    → { messages: [{ id, role, content, created_at }] }
// DELETE → 204 (chat + cascaded messages removed)
//
// Both are scoped by the resolved session user_id — service-role client used
// to bypass RLS in dev autologin mode, where no Supabase auth cookie is set.

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSessionProfile } from "@/lib/supabase-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, {
    db: { schema: "public" },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function resolveUserAndChat(chatId: string) {
  const session = await getSessionProfile();
  if (!session) return { error: 401 as const };
  const userId = session.user.id as string;

  const supa = getServiceClient();
  const { data: chat, error } = await supa
    .from("cockpit_chats")
    .select("id, user_id")
    .eq("id", chatId)
    .maybeSingle();
  if (error) return { error: 500 as const };
  if (!chat) return { error: 404 as const };
  if (chat.user_id !== userId) return { error: 403 as const };
  return { userId, supa };
}

export async function GET(
  _req: Request,
  ctx: { params: { chatId: string } },
) {
  const { chatId } = ctx.params;
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });
  const r = await resolveUserAndChat(chatId);
  if ("error" in r) {
    return NextResponse.json(
      { error: r.error === 401 ? "Not authenticated" : r.error === 403 ? "Forbidden" : "Not found" },
      { status: r.error },
    );
  }
  const { data, error } = await r.supa
    .from("cockpit_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", chatId)
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ messages: data ?? [] });
}

export async function DELETE(
  _req: Request,
  ctx: { params: { chatId: string } },
) {
  const { chatId } = ctx.params;
  if (!chatId) return NextResponse.json({ error: "chatId required" }, { status: 400 });
  const r = await resolveUserAndChat(chatId);
  if ("error" in r) {
    return NextResponse.json(
      { error: r.error === 401 ? "Not authenticated" : r.error === 403 ? "Forbidden" : "Not found" },
      { status: r.error },
    );
  }
  // ON DELETE CASCADE on cockpit_messages.chat_id removes messages, and on
  // review_documents.chat_id removes any generated memos for this chat.
  const { error } = await r.supa.from("cockpit_chats").delete().eq("id", chatId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
