// lib/advisor-format.js
// Pure format converters between the Anthropic block layout used for DB
// storage (role + content array of typed blocks) and the OpenAI chat-completion
// shape the HEARST Advisor sends to the upstream provider (Hyperbolic / Kimi).
//
// No I/O, no SDK imports — easy to unit-test in isolation. The advisor route
// imports both helpers from here.

export function toOpenAIMessages(anthropicMessages) {
  const out = [];
  for (const m of anthropicMessages) {
    if (m.role === 'user') {
      if (Array.isArray(m.content)) {
        const toolResults = m.content.filter(c => c.type === 'tool_result');
        const textParts = m.content.filter(c => c.type === 'text').map(c => c.text).join('');

        if (toolResults.length > 0) {
          for (const tr of toolResults) {
            out.push({
              role: 'tool',
              tool_call_id: tr.tool_use_id,
              content: typeof tr.content === 'string' ? tr.content : JSON.stringify(tr.content),
            });
          }
        }
        if (textParts) {
          out.push({ role: 'user', content: textParts });
        }
      } else {
        out.push({ role: 'user', content: m.content });
      }
    } else if (m.role === 'assistant') {
      if (Array.isArray(m.content)) {
        const textParts = m.content.filter(c => c.type === 'text').map(c => c.text).join('');
        const toolUses = m.content.filter(c => c.type === 'tool_use');

        if (toolUses.length > 0) {
          out.push({
            role: 'assistant',
            content: textParts || null,
            tool_calls: toolUses.map(tu => ({
              id: tu.id,
              type: 'function',
              function: {
                name: tu.name,
                arguments: JSON.stringify(tu.input || {}),
              },
            })),
          });
        } else {
          out.push({ role: 'assistant', content: textParts });
        }
      } else {
        out.push({ role: 'assistant', content: m.content });
      }
    }
  }
  return out;
}

export function openAIAssistantToAnthropic(msg) {
  const blocks = [];
  if (msg.content) {
    blocks.push({ type: 'text', text: msg.content });
  }
  if (msg.tool_calls) {
    for (const tc of msg.tool_calls) {
      blocks.push({
        type: 'tool_use',
        id: tc.id,
        name: tc.function.name,
        input: JSON.parse(tc.function.arguments || '{}'),
      });
    }
  }
  return { role: 'assistant', content: blocks };
}
