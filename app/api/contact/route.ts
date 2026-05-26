import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';
import { z } from 'zod';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_ORIGINS = [
  'https://oracle.hearst.app',
  'http://localhost:5005',
  ...(process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()).filter(Boolean) ?? []),
];
const VERCEL_PREVIEW_REGEX = /^https:\/\/[a-z0-9-]+\.vercel\.app$/;

function isAllowedOrigin(origin: string | null): boolean {
  if (!origin) return false;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (VERCEL_PREVIEW_REGEX.test(origin)) return true;
  return false;
}

const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const RATE_LIMIT_MAX = 5; // 5 sends per hour per IP
const rateStore = new Map<string, number[]>(); // IP -> timestamps

function getClientIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW_MS;
  const hits = (rateStore.get(ip) || []).filter(t => t > windowStart);
  if (hits.length >= RATE_LIMIT_MAX) {
    const oldest = hits[0];
    return { allowed: false, retryAfter: Math.ceil((oldest + RATE_LIMIT_WINDOW_MS - now) / 1000) };
  }
  hits.push(now);
  rateStore.set(ip, hits);
  return { allowed: true };
}

const bodySchema = z.object({
  fullName: z.string().trim().min(1).max(200),
  email: z.string().trim().email().max(200),
  company: z.string().trim().min(1).max(200),
}).strict();

const RECIPIENT = 'adrien@hearstcorporation.io';
const SENDER = 'Futur One <noreply@hearst.app>';

export async function POST(req: NextRequest) {
  const origin = req.headers.get('origin');
  if (!isAllowedOrigin(origin)) {
    return NextResponse.json({ error: 'forbidden_origin' }, { status: 403 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'mailer_not_configured' }, { status: 500 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Validation error', issues: [{ message: 'Invalid JSON body' }] }, { status: 400 });
  }

  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Validation error', issues: parsed.error.issues }, { status: 400 });
  }

  const { fullName, email, company } = parsed.data;

  const ip = getClientIp(req);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: 'rate_limited', detail: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } }
    );
  }

  const resend = new Resend(apiKey);

  const html = `
    <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
      <h2 style="margin: 0 0 24px 0; font-size: 20px; font-weight: 700;">New Briefing Request — Futur One</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #666; width: 120px;">NAME</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px;">${escapeHtml(fullName)}</td>
        </tr>
        <tr>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #666;">EMAIL</td>
          <td style="padding: 12px 0; border-bottom: 1px solid #e5e5e5; font-size: 14px;"><a href="mailto:${escapeHtml(email)}" style="color: #8b1a1a;">${escapeHtml(email)}</a></td>
        </tr>
        <tr>
          <td style="padding: 12px 0; font-size: 12px; font-weight: 600; letter-spacing: 0.5px; color: #666;">COMPANY</td>
          <td style="padding: 12px 0; font-size: 14px;">${escapeHtml(company)}</td>
        </tr>
      </table>
      <p style="margin-top: 32px; font-size: 12px; color: #999;">Sent via the Futur One briefing request form.</p>
    </div>
  `;

  try {
    const { error } = await resend.emails.send({
      from: SENDER,
      to: RECIPIENT,
      replyTo: email,
      subject: `[FUTUR ONE] Briefing request — ${company}`,
      html,
    });

    if (error) {
      return NextResponse.json({ error: 'mail_send_failed', detail: error.message }, { status: 502 });
    }
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'mail_send_failed', detail }, { status: 502 });
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
