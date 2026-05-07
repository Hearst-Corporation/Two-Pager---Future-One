import { NextResponse } from 'next/server';

export async function POST(req) {
  const { password } = await req.json();
  const expected = process.env.ADMIN_PASSWORD || '';
  if (!expected || password !== expected) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_gate', expected, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set('admin_gate', '', { path: '/', maxAge: 0 });
  return res;
}
