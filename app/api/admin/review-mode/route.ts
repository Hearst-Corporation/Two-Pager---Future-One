// app/api/admin/review-mode/route.ts
//
// GET  → returns the current admin's chat mode ("normal" | "review").
// POST → upserts the admin's chat mode. Body: { mode: "normal" | "review" }.
//
// Admin gated via crm.profiles.role === "admin" (requireProfile helper).

import { NextResponse } from "next/server";
import { requireProfile } from "@/lib/supabase-admin";
import { getAdminChatMode, setAdminChatMode } from "@/lib/review-mode/supabase-helpers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const r = await requireProfile("admin");
  if (r instanceof NextResponse) return r;
  const userId = r.profile.id as string;
  try {
    const mode = await getAdminChatMode(userId);
    return NextResponse.json({ mode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const r = await requireProfile("admin");
  if (r instanceof NextResponse) return r;
  const userId = r.profile.id as string;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const mode = (body as { mode?: unknown })?.mode;
  if (mode !== "normal" && mode !== "review") {
    return NextResponse.json({ error: "mode must be 'normal' or 'review'" }, { status: 400 });
  }

  try {
    await setAdminChatMode(userId, mode);
    return NextResponse.json({ mode });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
