import { describe, it, expect } from 'vitest';
import { retryWithBackoff } from '@/lib/retry-with-backoff';

describe('retry-with-backoff', () => {
  it('should succeed on first attempt', async () => {
    const fn = () => Promise.resolve('success');
    const result = await retryWithBackoff(fn);
    expect(result).toBe('success');
  });

  it('should retry on retryable error and eventually succeed', async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 3) {
        const err = new Error('rate limit');
        err.status = 429;
        return Promise.reject(err);
      }
      return Promise.resolve('success');
    };

    const result = await retryWithBackoff(fn, { maxRetries: 3, baseDelayMs: 10 });
    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  it('should throw after max retries exceeded', async () => {
    const err = new Error('service unavailable');
    err.status = 503;
    const fn = () => Promise.reject(err);

    await expect(retryWithBackoff(fn, { maxRetries: 2, baseDelayMs: 10 })).rejects.toThrow('service unavailable');
  });

  it('should not retry non-retryable errors', async () => {
    let attempts = 0;
    const fn = () => {
      attempts++;
      return Promise.reject(new Error('bad request'));
    };

    await expect(retryWithBackoff(fn, { maxRetries: 3, baseDelayMs: 10 })).rejects.toThrow('bad request');
    expect(attempts).toBe(1);
  });

  it('should respect abort signal', async () => {
    const controller = new AbortController();
    controller.abort();

    const fn = () => Promise.resolve('success');
    await expect(retryWithBackoff(fn, { signal: controller.signal })).rejects.toThrow('Retry aborted');
  });

  it('should call onRetry callback', async () => {
    const retries = [];
    let attempts = 0;
    const fn = () => {
      attempts++;
      if (attempts < 2) {
        const err = new Error('timeout');
        err.code = 'ETIMEDOUT';
        return Promise.reject(err);
      }
      return Promise.resolve('success');
    };

    await retryWithBackoff(fn, {
      maxRetries: 3,
      baseDelayMs: 10,
      onRetry: (err, attempt) => {
        retries.push({ attempt, message: err.message });
      },
    });

    expect(retries.length).toBe(1);
    expect(retries[0].attempt).toBe(1);
    expect(retries[0].message).toBe('timeout');
  });
});
