// lib/demo-mode.js
//
// Wave 1 — SAFE_DEMO_MODE.
// A single environment flag that disables every surface capable of failing
// live during an institutional presentation. When enabled, guarded
// routes return 503.
//
// Server flag : SAFE_DEMO_MODE=1
// Client flag : NEXT_PUBLIC_SAFE_DEMO_MODE=1  (so the badge can render)
//
// Goal: zero live failures possible during a demo, without removing any code.

const TRUTHY = new Set(['1', 'true', 'yes', 'on']);

export function isSafeDemoMode() {
  const server = (process.env.SAFE_DEMO_MODE || '').toLowerCase();
  const client = (process.env.NEXT_PUBLIC_SAFE_DEMO_MODE || '').toLowerCase();
  return TRUTHY.has(server) || TRUTHY.has(client);
}

export const DEMO_DISABLED_RESPONSE = {
  error: 'disabled_in_demo_mode',
  message: 'This surface is disabled in SAFE_DEMO_MODE for presentation safety. Disable SAFE_DEMO_MODE to re-enable.',
};
