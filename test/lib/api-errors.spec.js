// test/lib/api-errors.spec.js
// Unit tests for lib/api-errors.js helpers.

import { describe, it, expect, vi } from 'vitest';
import { dbErrorResponse, notFoundResponse } from '../../lib/api-errors.js';

describe('dbErrorResponse', () => {
  it('returns a 500 response with generic error key', async () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const res = dbErrorResponse(new Error('real db detail'), '[test][label]');
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json).toEqual({ error: 'database_error' });
    expect(json.error).not.toContain('real db detail');
    consoleSpy.mockRestore();
  });

  it('logs the real error message server-side', async () => {
    const logged = [];
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation((...args) => logged.push(args));
    dbErrorResponse(new Error('pg: relation does not exist'), '[test]');
    expect(logged[0].join(' ')).toContain('pg: relation does not exist');
    consoleSpy.mockRestore();
  });
});

describe('notFoundResponse', () => {
  it('returns a 404 response with not_found key', async () => {
    const res = notFoundResponse();
    expect(res.status).toBe(404);
    const json = await res.json();
    expect(json).toEqual({ error: 'not_found' });
  });
});
