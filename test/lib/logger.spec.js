// test/lib/logger.spec.js
// Regression coverage for lib/logger.js — specifically the defensive
// JSON.stringify path added after a circular payload would crash the request.

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { logger } from '../../lib/logger.js';

describe('logger', () => {
  let consoleLogSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    // The logger respects LOG_LEVEL; force it to debug so info/warn/error all fire.
    process.env.LOG_LEVEL = 'debug';
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete process.env.LOG_LEVEL;
  });

  it('does not throw on a circular payload and emits a serialization-failed fallback', () => {
    const circular = { a: 1 };
    circular.self = circular;

    expect(() => logger.info({ event: 'x', circular })).not.toThrow();
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);

    const written = consoleLogSpy.mock.calls[0][0];
    expect(typeof written).toBe('string');
    expect(written).toContain('logger_serialization_failed');
    // The fallback envelope preserves the original event name for triage.
    const parsed = JSON.parse(written);
    expect(parsed.event).toBe('logger_serialization_failed');
    expect(parsed.original_event).toBe('x');
    expect(parsed.level).toBe('info');
  });

  it('emits a normal JSON line for an acyclic payload', () => {
    logger.info({ event: 'hello', count: 1 });
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);
    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.event).toBe('hello');
    expect(parsed.count).toBe(1);
    expect(parsed.level).toBe('info');
  });

  it('does not rethrow when payload.event has a throwing getter', () => {
    const trap = {};
    Object.defineProperty(trap, 'event', { get() { throw new Error('boom'); } });
    // Make it circular too, to force the fallback path through JSON.stringify.
    trap.self = trap;

    expect(() => logger.info(trap)).not.toThrow();
    expect(consoleLogSpy).toHaveBeenCalledTimes(1);

    const parsed = JSON.parse(consoleLogSpy.mock.calls[0][0]);
    expect(parsed.event).toBe('logger_serialization_failed');
    // event:'unknown' because the getter threw — confirm it's NOT propagated.
    expect(parsed.original_event).toBe('unknown');
  });
});
