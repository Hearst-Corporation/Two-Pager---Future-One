import { describe, it, expect } from 'vitest';
import { getAdvisorRailMode } from '../lib/oracle-advisor-routes.js';

describe('getAdvisorRailMode', () => {
  it('returns chat-only on reference library pages', () => {
    expect(getAdvisorRailMode('/admin/hearst/deals')).toBe('chat-only');
    expect(getAdvisorRailMode('/admin/hearst/sources')).toBe('chat-only');
    expect(getAdvisorRailMode('/admin/hearst/workspace')).toBe('chat-only');
  });

  it('returns full on modeling pages', () => {
    expect(getAdvisorRailMode('/admin/hearst/simulator')).toBe('full');
    expect(getAdvisorRailMode('/admin/hearst/financial')).toBe('full');
    expect(getAdvisorRailMode('/admin/hearst/simulator/results')).toBe('full');
  });

  it('dossier: chat-only on list, full on memo detail', () => {
    const spList = new URLSearchParams('');
    const spMemo = new URLSearchParams('memo=abc');
    const spScenario = new URLSearchParams('scenario=xyz');
    expect(getAdvisorRailMode('/admin/hearst/dossier', spList)).toBe('chat-only');
    expect(getAdvisorRailMode('/admin/hearst/dossier', spScenario)).toBe('chat-only');
    expect(getAdvisorRailMode('/admin/hearst/dossier', spMemo)).toBe('full');
  });
});
