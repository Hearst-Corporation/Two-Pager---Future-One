// app/api/cockpit-chats/route.ts
//
// Endpoints consumed by @hearst/cockpit-shell's history panel.
//
// GET    → { chats: [{ id, title, updated_at }] }
// DELETE → 204 (deletes all chats owned by the current user)

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

export async function GET() {
  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const supa = getServiceClient();

  // We surface chats most-recently-updated first. cockpit_chats has only
  // `created_at`, so we approximate "updated_at" as the timestamp of the
  // chat's most recent message (or the chat creation time if empty).
  const { data: chats, error } = await supa
    .from("cockpit_chats")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  if (!chats || chats.length === 0) {
    return NextResponse.json({ chats: [] });
  }

  const ids = chats.map((c) => c.id as string);
  const { data: lastMsgs } = await supa
    .from("cockpit_messages")
    .select("chat_id, created_at")
    .in("chat_id", ids)
    .order("created_at", { ascending: false });

  const latestByChat = new Map<string, string>();
  for (const m of lastMsgs ?? []) {
    const cid = m.chat_id as string;
    if (!latestByChat.has(cid)) latestByChat.set(cid, m.created_at as string);
  }

  const enriched = chats
    .map((c) => ({
      id: c.id as string,
      title: (c.title as string | null) ?? "Nouvelle conversation",
      updated_at: latestByChat.get(c.id as string) ?? (c.created_at as string),
    }))
    .sort((a, b) => (a.updated_at < b.updated_at ? 1 : -1));

  return NextResponse.json({ chats: enriched });
}

export async function DELETE() {
  const session = await getSessionProfile();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const userId = session.user.id as string;
  const supa = getServiceClient();
  const { error } = await supa.from("cockpit_chats").delete().eq("user_id", userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return new NextResponse(null, { status: 204 });
}
