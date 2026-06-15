/**
 * cockpit-chat-bridge.spec.js — chat scope must not flip on every simulator state tick.
 */
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = readFileSync(
  fileURLToPath(new URL('../../components/admin/CockpitChatBridge.jsx', import.meta.url)),
  'utf-8',
);

describe('CockpitChatBridge — chat scope stability', () => {
  it('derives simulatorLive boolean for scope memo', () => {
    expect(src).toMatch(/const simulatorLive/);
    expect(src).toMatch(/advisorContext\?\.surface === 'simulator'/);
  });

  it('chatScope useMemo does not depend on full advisorContext', () => {
    expect(src).toMatch(/\[memoId,\s*pathname,\s*savedScenarioId,\s*simulatorLive\]/);
    expect(src).not.toMatch(/\[advisorContext,\s*pathname,\s*memoId\]/);
  });
});
