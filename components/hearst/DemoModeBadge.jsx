'use client';

// Wave 1 — SAFE_DEMO_MODE badge.
// Renders a fixed "Demo Mode" chip when NEXT_PUBLIC_SAFE_DEMO_MODE is set, so a
// presenter (and the room) can see at a glance that failure-prone live surfaces
// (advisor, chat, live refresh, gpu-prices) are disabled. No-op otherwise.

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

export default function DemoModeBadge() {
  const flag = (process.env.NEXT_PUBLIC_SAFE_DEMO_MODE || '').toLowerCase();
  if (!TRUTHY.has(flag)) return null;

  return (
    <div
      role="status"
      aria-label="Demo mode enabled — live surfaces disabled"
      style={{
        position: 'fixed',
        top: 12,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: '0.04em',
        color: '#fff',
        background: 'var(--cp-accent)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
        pointerEvents: 'none',
        textTransform: 'uppercase',
      }}
    >
      <span aria-hidden="true" style={{
        width: 7, height: 7, borderRadius: '50%',
        background: '#fff', display: 'inline-block',
      }} />
      Demo Mode
    </div>
  );
}
