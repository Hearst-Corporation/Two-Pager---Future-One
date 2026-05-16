// test/api/advisor.spec.js
// Regression coverage for the Anthropic-block <-> OpenAI message conversion
// performed by lib/advisor-format.js. The advisor route accepts Anthropic-style
// block arrays from the client and must reshape them into the OpenAI
// chat-completion format that Hyperbolic expects, including the assistant /
// tool branches that carry tool_use and tool_result blocks.

import { describe, it, expect } from 'vitest';
import { toOpenAIMessages, openAIAssistantToAnthropic } from '@/lib/advisor-format';

describe('toOpenAIMessages — singular message normalisation', () => {
  it('converts a single text-block message to a flat OpenAI string content', () => {
    const out = toOpenAIMessages([
      { role: 'user', content: [{ type: 'text', text: 'hi there' }] },
    ]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe('user');
    expect(out[0].content).toBe('hi there');
  });

  it('preserves bare-string user content', () => {
    const out = toOpenAIMessages([{ role: 'user', content: 'raw' }]);
    expect(out[0].content).toBe('raw');
  });
});

describe('toOpenAIMessages — assistant / tool branches', () => {
  it('converts an assistant tool_use block to an OpenAI tool_calls array', () => {
    const out = toOpenAIMessages([{
      role: 'assistant',
      content: [{ type: 'tool_use', id: 'call_1', name: 'get_x', input: { foo: 'bar' } }],
    }]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe('assistant');
    // No text part, so the converter emits content:null alongside the tool_calls.
    expect(out[0].content).toBeNull();
    expect(out[0].tool_calls).toEqual([{
      id: 'call_1',
      type: 'function',
      function: { name: 'get_x', arguments: JSON.stringify({ foo: 'bar' }) },
    }]);
  });

  it('converts a user tool_result block to an OpenAI role:"tool" message', () => {
    const out = toOpenAIMessages([{
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'call_1', content: 'result text' }],
    }]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe('tool');
    expect(out[0].tool_call_id).toBe('call_1');
    expect(typeof out[0].content).toBe('string');
    expect(out[0].content).toBe('result text');
  });

  it('serialises non-string tool_result content via JSON.stringify', () => {
    // The converter stringifies any non-string content so the OpenAI side
    // always receives a flat string body, even when the agent stored a structured payload.
    const out = toOpenAIMessages([{
      role: 'user',
      content: [{ type: 'tool_result', tool_use_id: 'call_2', content: [{ type: 'text', text: 'ok' }] }],
    }]);
    expect(out[0].role).toBe('tool');
    expect(out[0].tool_call_id).toBe('call_2');
    expect(out[0].content).toBe(JSON.stringify([{ type: 'text', text: 'ok' }]));
  });

  it('handles a mixed text + tool_use assistant message in a single OpenAI message', () => {
    const out = toOpenAIMessages([{
      role: 'assistant',
      content: [
        { type: 'text', text: 'Thinking...' },
        { type: 'tool_use', id: 'call_a', name: 'list', input: {} },
      ],
    }]);
    expect(out).toHaveLength(1);
    expect(out[0].role).toBe('assistant');
    expect(out[0].content).toContain('Thinking');
    expect(out[0].tool_calls).toHaveLength(1);
    expect(out[0].tool_calls[0].function.name).toBe('list');
    // Empty input still serialises to '{}', not undefined.
    expect(out[0].tool_calls[0].function.arguments).toBe('{}');
  });
});

describe('openAIAssistantToAnthropic — reverse conversion', () => {
  it('converts a text-only assistant message to a single text block', () => {
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: 'Hello world',
    });
    expect(out.role).toBe('assistant');
    expect(out.content).toEqual([{ type: 'text', text: 'Hello world' }]);
  });

  it('converts tool_calls-only message to tool_use blocks (no text block prepended)', () => {
    // No content string → no text block is emitted, only tool_use blocks.
    // Arguments JSON string is parsed back into the structured `input` object.
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'call_1', type: 'function', function: { name: 'get_x', arguments: JSON.stringify({ foo: 'bar' }) } },
        { id: 'call_2', type: 'function', function: { name: 'list', arguments: '{}' } },
      ],
    });
    expect(out.role).toBe('assistant');
    expect(out.content).toHaveLength(2);
    expect(out.content[0]).toEqual({ type: 'tool_use', id: 'call_1', name: 'get_x', input: { foo: 'bar' } });
    expect(out.content[1]).toEqual({ type: 'tool_use', id: 'call_2', name: 'list', input: {} });
  });

  it('converts mixed text + tool_calls into ordered text-then-tool_use blocks', () => {
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: 'Let me check.',
      tool_calls: [
        { id: 'call_a', type: 'function', function: { name: 'lookup', arguments: JSON.stringify({ q: 'kpi' }) } },
      ],
    });
    expect(out.role).toBe('assistant');
    expect(out.content).toHaveLength(2);
    // Text block always comes before tool_use blocks (matches implementation order).
    expect(out.content[0]).toEqual({ type: 'text', text: 'Let me check.' });
    expect(out.content[1]).toEqual({ type: 'tool_use', id: 'call_a', name: 'lookup', input: { q: 'kpi' } });
  });

  it('defaults missing or empty tool_call arguments to an empty object via JSON.parse fallback', () => {
    // The impl uses `tc.function.arguments || '{}'`, so an empty string / undefined
    // both resolve to `{}` without throwing.
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'call_empty', type: 'function', function: { name: 'noop', arguments: '' } },
      ],
    });
    expect(out.content).toHaveLength(1);
    expect(out.content[0]).toEqual({ type: 'tool_use', id: 'call_empty', name: 'noop', input: {} });
  });

  it('throws when tool_call arguments is malformed JSON (caller responsibility)', () => {
    // The converter does NOT swallow JSON.parse errors — upstream callers must
    // guarantee well-formed arguments. This regression-locks the current behavior.
    expect(() => openAIAssistantToAnthropic({
      role: 'assistant',
      content: null,
      tool_calls: [
        { id: 'call_bad', type: 'function', function: { name: 'broken', arguments: '{not-json' } },
      ],
    })).toThrow(SyntaxError);
  });

  it('treats empty-string content as falsy and emits no text block (tool_calls only)', () => {
    // `content: ''` is falsy, so the converter skips the text block and only
    // emits the tool_use blocks from tool_calls.
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: '',
      tool_calls: [
        { id: 'call_e', type: 'function', function: { name: 'noop', arguments: '{}' } },
      ],
    });
    expect(out.content).toHaveLength(1);
    expect(out.content[0]).toEqual({ type: 'tool_use', id: 'call_e', name: 'noop', input: {} });
  });

  it('skips the tool_calls loop on empty array and emits only the text block', () => {
    // `tool_calls: []` is truthy but iterates zero times — only the text block
    // from `content` should be emitted.
    const out = openAIAssistantToAnthropic({
      role: 'assistant',
      content: 'hello',
      tool_calls: [],
    });
    expect(out.content).toHaveLength(1);
    expect(out.content[0]).toEqual({ type: 'text', text: 'hello' });
  });
});
