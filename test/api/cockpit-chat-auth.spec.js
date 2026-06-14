// test/api/cockpit-chat-auth.spec.js
// Verifies that POST /api/cockpit-chat returns 401 when unauthenticated
// and does NOT call the OpenAI upstream.

import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Module-level mocks (hoisted by Vitest) ────────────────────────────────

vi.mock('@/lib/supabase-server', () => ({
  getSessionProfile: vi.fn(),
}));

vi.mock('@/lib/demo-mode', () => ({
  isSafeDemoMode: vi.fn(() => false),
  DEMO_DISABLED_RESPONSE: { error: 'demo_mode' },
}));

const openaiChatStreamMock = vi.fn();
vi.mock('@/lib/llm/openai', () => ({
  OPENAI_CHAT_MODEL: 'gpt-4o',
  openaiChatStream: openaiChatStreamMock,
}));

vi.mock('@/lib/llm/cost', () => ({
  estimateOpenAICostUsd: vi.fn(() => 0),
}));

vi.mock('@/lib/review-mode/supabase-helpers', () => ({
  getAdminChatMode: vi.fn(async () => 'normal'),
  insertLlmRun: vi.fn(async () => {}),
}));

vi.mock('@/lib/review-mode/prompt-hash', () => ({
  CONVERSATIONAL_PROMPT: 'prompt',
  CONVERSATIONAL_PROMPT_HASH: 'hash',
  FACILITATOR_PROMPT: 'prompt',
  FACILITATOR_PROMPT_HASH: 'hash',
}));

vi.mock('@/lib/review-mode/user-tuning', () => ({
  parseTuningCommand: vi.fn(() => null),
  addTuning: vi.fn(),
  listActiveTunings: vi.fn(async () => []),
  removeTuningByShortId: vi.fn(),
  clearTunings: vi.fn(),
  renderTuningBlock: vi.fn(() => ''),
  helpText: vi.fn(() => ''),
}));

vi.mock('@/lib/oracle-system-prompt', () => ({
  buildOracleSystemPrompt: vi.fn(() => ''),
  inferOracleContextFromPath: vi.fn(() => ({})),
}));

vi.mock('@/lib/oracle-deal-grounding', () => ({
  buildDealGroundingBlock: vi.fn(() => ''),
}));

vi.mock('@/lib/oracle-active-deal', () => ({
  resolveActiveDeal: vi.fn(async () => null),
}));

vi.mock('@/lib/cockpit-chat-ownership', () => ({
  userOwnsChat: vi.fn(async () => true),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: vi.fn(() => ({
      insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn(async () => ({ data: { id: 'chat-1' }, error: null })) })) })),
      select: vi.fn(() => ({ eq: vi.fn(() => ({ order: vi.fn(async () => ({ data: [], error: null })) })) })),
    })),
  })),
}));

vi.mock('@/lib/review-mode/tokens', () => ({
  estimateTokens: vi.fn(() => 100),
}));

// ── Helpers ───────────────────────────────────────────────────────────────

function makeRequest(body = { message: 'hello' }) {
  return {
    json: async () => body,
    headers: { get: vi.fn(() => null) },
    signal: { aborted: false },
  };
}

async function readResponse(res) {
  const text = await res.text();
  let parsed = null;
  try { parsed = JSON.parse(text); } catch { /* keep null */ }
  return { status: res.status, body: parsed, headers: res.headers };
}

// ── Tests ─────────────────────────────────────────────────────────────────

describe('POST /api/cockpit-chat — auth guard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 401 with authentication_required when unauthenticated', async () => {
    const { getSessionProfile } = await import('@/lib/supabase-server');
    getSessionProfile.mockResolvedValue(null);

    const { POST } = await import('@/app/api/cockpit-chat/route.ts');
    const res = await POST(makeRequest());
    const { status, body } = await readResponse(res);

    expect(status).toBe(401);
    expect(body).toEqual({ error: 'authentication_required' });
  });

  it('does NOT call OpenAI when unauthenticated', async () => {
    const { getSessionProfile } = await import('@/lib/supabase-server');
    getSessionProfile.mockResolvedValue(null);

    const { POST } = await import('@/app/api/cockpit-chat/route.ts');
    await POST(makeRequest());

    expect(openaiChatStreamMock).not.toHaveBeenCalled();
  });

  it('returns 401 when session exists but has no user.id', async () => {
    const { getSessionProfile } = await import('@/lib/supabase-server');
    getSessionProfile.mockResolvedValue({ user: { id: null } });

    const { POST } = await import('@/app/api/cockpit-chat/route.ts');
    const res = await POST(makeRequest());
    const { status, body } = await readResponse(res);

    expect(status).toBe(401);
    expect(body).toEqual({ error: 'authentication_required' });
    expect(openaiChatStreamMock).not.toHaveBeenCalled();
  });

  it('returns 503 (not 401) when SAFE_DEMO_MODE is active — demo check runs before auth', async () => {
    const { isSafeDemoMode } = await import('@/lib/demo-mode');
    isSafeDemoMode.mockReturnValue(true);

    const { getSessionProfile } = await import('@/lib/supabase-server');
    getSessionProfile.mockResolvedValue(null);

    const { POST } = await import('@/app/api/cockpit-chat/route.ts');
    const res = await POST(makeRequest());

    expect(res.status).toBe(503);
    expect(openaiChatStreamMock).not.toHaveBeenCalled();
  });
});
