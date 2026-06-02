import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  clearMemoJob,
  getSnapshot,
  MEMO_CLIENT_TIMEOUT_MS,
  startMemoJob,
} from '@/lib/hearst-memo-job-store';

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  clearMemoJob();
});

describe('hearst memo job store', () => {
  it('keeps the client timeout above the Kimi server timeout', () => {
    expect(MEMO_CLIENT_TIMEOUT_MS).toBe(300_000);
    expect(MEMO_CLIENT_TIMEOUT_MS).toBeGreaterThan(120_000);
  });

  it('moves a hanging memo request to error after the client timeout', async () => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn((_url, init) => new Promise((_resolve, reject) => {
      init.signal.addEventListener('abort', () => {
        reject(Object.assign(new Error('aborted'), { name: 'AbortError' }));
      });
    })));

    startMemoJob({ payload: { scenario: { total_mw: 30 } }, scenarioLabel: 'Test scenario' });
    expect(getSnapshot().status).toBe('loading');

    await vi.advanceTimersByTimeAsync(MEMO_CLIENT_TIMEOUT_MS);

    expect(getSnapshot().status).toBe('error');
    expect(getSnapshot().error).toMatch(/timed out after 300s/i);
  });
});
