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
  if (!session?.user?.id) {
    return NextResponse.json({ chats: [] });
  }

  const supa = getServiceClient();
  const { data, error } = await supa
    .from("cockpit_chats")
    .select("id, title, created_at")
    .eq("user_id", session.user.id)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.warn("[cockpit-chats] list failed", error.message);
    return NextResponse.json({ error: "chat_list_failed" }, { status: 500 });
  }

  return NextResponse.json({
    chats: (data ?? []).map(chat => ({
      ...chat,
      updated_at: chat.created_at,
    })),
  });
}

export async function DELETE() {
  const session = await getSessionProfile();
  if (!session?.user?.id) {
    return NextResponse.json({ ok: true });
  }

  const supa = getServiceClient();
  const { error } = await supa
    .from("cockpit_chats")
    .delete()
    .eq("user_id", session.user.id);

  if (error) {
    console.warn("[cockpit-chats] clear failed", error.message);
    return NextResponse.json({ error: "chat_clear_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
