import { describe, it, expect } from 'vitest';
import {
  buildChatDealPayload,
  getScopedChatStorageKey,
  resolveChatScope,
  syncScopedChatToShell,
} from '../lib/cockpit-chat-payload.js';

describe('buildChatDealPayload', () => {
  it('returns null without projection', () => {
    expect(buildChatDealPayload(null)).toBeNull();
    expect(buildChatDealPayload({ state: {} })).toBeNull();
  });

  it('packages scenario, projection and merged warnings', () => {
    const payload = buildChatDealPayload({
      scenario: { total_mw: 50, archetype_id: 'powered_shell' },
      projection: { irr: 0.18, warnings: ['warn-a'] },
      simResult: { warnings: ['warn-b', 'warn-a'] },
    });
    expect(payload.scenario.total_mw).toBe(50);
    expect(payload.projection.irr).toBe(0.18);
    expect(payload.warnings).toEqual(['warn-b', 'warn-a']);
  });
});

describe('resolveChatScope', () => {
  it('prioritizes memo, then saved scenario, then live simulator', () => {
    const ctx = {
      surface: 'simulator',
      projection: { irr: 0.2 },
      savedScenarioId: 'sc-1',
    };
    expect(resolveChatScope(ctx, '/admin/hearst/simulator', 'memo-9')).toBe('memo:memo-9');
    expect(resolveChatScope(ctx, '/admin/hearst/simulator')).toBe('scenario:sc-1');
    expect(resolveChatScope(
      { surface: 'simulator', projection: { irr: 0.2 } },
      '/admin/hearst/simulator',
    )).toBe('live:simulator');
  });

  it('falls back to page pathname', () => {
    expect(resolveChatScope(null, '/admin/hearst/deals')).toBe('page:/admin/hearst/deals');
  });

  it('builds scoped storage keys', () => {
    expect(getScopedChatStorageKey('scenario:abc')).toBe('oracle:chat-id:scenario:abc');
  });
});

describe('syncScopedChatToShell', () => {
  it('calls setActiveChat with scoped id from localStorage', () => {
    const calls = [];
    const storage = new Map([['oracle:chat-id:scenario:abc', 'chat-uuid']]);
    const ls = {
      getItem: (k) => storage.get(k) ?? null,
      setItem: (k, v) => storage.set(k, v),
    };
    const prev = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', { value: ls, configurable: true });

    syncScopedChatToShell('scenario:abc', (id) => calls.push(id));
    expect(calls).toEqual(['chat-uuid']);

    syncScopedChatToShell('scenario:new', (id) => calls.push(id));
    expect(calls).toEqual(['chat-uuid', null]);

    Object.defineProperty(globalThis, 'localStorage', { value: prev, configurable: true });
  });
});
