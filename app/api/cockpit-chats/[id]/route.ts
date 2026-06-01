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

export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionProfile();
  if (!session?.user?.id) {
    return NextResponse.json({ messages: [] });
  }

  const supa = getServiceClient();
  const { data: chat, error: chatErr } = await supa
    .from("cockpit_chats")
    .select("id")
    .eq("id", params.id)
    .eq("user_id", session.user.id)
    .maybeSingle();

  if (chatErr) {
    console.warn("[cockpit-chats] chat lookup failed", chatErr.message);
    return NextResponse.json({ error: "chat_lookup_failed" }, { status: 500 });
  }
  if (!chat) {
    return NextResponse.json({ messages: [] }, { status: 404 });
  }

  const { data: messages, error: msgErr } = await supa
    .from("cockpit_messages")
    .select("id, role, content, created_at")
    .eq("chat_id", params.id)
    .order("created_at", { ascending: true });

  if (msgErr) {
    console.warn("[cockpit-chats] messages load failed", msgErr.message);
    return NextResponse.json({ error: "messages_load_failed" }, { status: 500 });
  }

  return NextResponse.json({ messages: messages ?? [] });
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  const session = await getSessionProfile();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  const supa = getServiceClient();
  const { error } = await supa
    .from("cockpit_chats")
    .delete()
    .eq("id", params.id)
    .eq("user_id", session.user.id);

  if (error) {
    console.warn("[cockpit-chats] delete failed", error.message);
    return NextResponse.json({ error: "chat_delete_failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
