import { describe, it, expect, vi } from 'vitest';
import { userOwnsChat } from '../lib/cockpit-chat-ownership';

function mockSupa(row) {
  return {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          eq: vi.fn(() => ({
            maybeSingle: vi.fn(async () => ({ data: row, error: null })),
          })),
        })),
      })),
    })),
  };
}

describe('userOwnsChat', () => {
  it('returns true when chat row exists for user', async () => {
    const supa = mockSupa({ id: 'chat-1' });
    await expect(userOwnsChat(supa, 'chat-1', 'user-1')).resolves.toBe(true);
  });

  it('returns false when chat row is missing', async () => {
    const supa = mockSupa(null);
    await expect(userOwnsChat(supa, 'chat-foreign', 'user-1')).resolves.toBe(false);
  });

  it('throws on DB error', async () => {
    const supa = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            eq: vi.fn(() => ({
              maybeSingle: vi.fn(async () => ({ data: null, error: { message: 'db down' } })),
            })),
          })),
        })),
      })),
    };
    await expect(userOwnsChat(supa, 'chat-1', 'user-1')).rejects.toEqual({ message: 'db down' });
  });
});
