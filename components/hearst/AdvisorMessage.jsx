// components/hearst/AdvisorMessage.jsx
// Renders a single message bubble (user or assistant) with lightweight markdown.

import AdvisorToolCard from './AdvisorToolCard';
import { C } from '@/lib/admin-tokens';

function renderInline(text) {
  if (!text) return null;
  // Escape, then bold/italic/code in a single pass via tokenization.
  const tokens = [];
  let i = 0;
  while (i < text.length) {
    // bold **xxx**
    const b = text.indexOf('**', i);
    const it = text.indexOf('*', i);
    const c = text.indexOf('`', i);
    const lnk = text.indexOf('[', i);
    const candidates = [b, it, c, lnk].filter(x => x !== -1);
    if (candidates.length === 0) { tokens.push({ t: 'text', v: text.slice(i) }); break; }
    const next = Math.min(...candidates);
    if (next > i) tokens.push({ t: 'text', v: text.slice(i, next) });
    if (next === b) {
      const end = text.indexOf('**', b + 2);
      if (end === -1) { tokens.push({ t: 'text', v: text.slice(b) }); break; }
      tokens.push({ t: 'bold', v: text.slice(b + 2, end) });
      i = end + 2;
    } else if (next === c) {
      const end = text.indexOf('`', c + 1);
      if (end === -1) { tokens.push({ t: 'text', v: text.slice(c) }); break; }
      tokens.push({ t: 'code', v: text.slice(c + 1, end) });
      i = end + 1;
    } else if (next === lnk) {
      const closeBr = text.indexOf(']', lnk);
      const openPar = closeBr !== -1 ? text.indexOf('(', closeBr) : -1;
      const closePar = openPar !== -1 ? text.indexOf(')', openPar) : -1;
      if (closeBr === -1 || openPar !== closeBr + 1 || closePar === -1) {
        tokens.push({ t: 'text', v: text[lnk] });
        i = lnk + 1;
      } else {
        tokens.push({ t: 'link', label: text.slice(lnk + 1, closeBr), href: text.slice(openPar + 1, closePar) });
        i = closePar + 1;
      }
    } else if (next === it) {
      // skip plain * — too ambiguous, treat as text
      const peek = text.indexOf('*', it + 1);
      if (peek === -1 || peek === it + 1) { tokens.push({ t: 'text', v: text[it] }); i = it + 1; }
      else { tokens.push({ t: 'italic', v: text.slice(it + 1, peek) }); i = peek + 1; }
    }
  }
  return tokens.map((tk, idx) => {
    if (tk.t === 'text') return <span key={idx}>{tk.v}</span>;
    if (tk.t === 'bold') return <strong key={idx} style={{ fontWeight: 700 }}>{tk.v}</strong>;
    if (tk.t === 'italic') return <em key={idx}>{tk.v}</em>;
    if (tk.t === 'code') return <code key={idx} style={S.codeInline}>{tk.v}</code>;
    if (tk.t === 'link') return <a key={idx} href={tk.href} target="_blank" rel="noopener noreferrer" style={S.link}>{tk.label}</a>;
    return null;
  });
}

function renderMarkdown(text) {
  if (!text) return null;
  const blocks = [];
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const end = lines.indexOf('```', i + 1);
      const code = lines.slice(i + 1, end === -1 ? lines.length : end).join('\n');
      blocks.push({ t: 'code_block', v: code });
      i = end === -1 ? lines.length : end + 1;
      continue;
    }
    if (line.startsWith('### ')) { blocks.push({ t: 'h3', v: line.slice(4) }); i++; continue; }
    if (line.startsWith('## ')) { blocks.push({ t: 'h2', v: line.slice(3) }); i++; continue; }
    if (line.startsWith('# ')) { blocks.push({ t: 'h1', v: line.slice(2) }); i++; continue; }
    if (/^[-*] /.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*] /.test(lines[i])) { items.push(lines[i].slice(2)); i++; }
      blocks.push({ t: 'ul', items });
      continue;
    }
    if (/^\d+\. /.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\. /.test(lines[i])) { items.push(lines[i].replace(/^\d+\. /, '')); i++; }
      blocks.push({ t: 'ol', items });
      continue;
    }
    if (line.trim() === '') { i++; continue; }
    // paragraph (collect adjacent non-blank lines)
    const para = [line];
    i++;
    while (i < lines.length && lines[i].trim() !== '' && !/^([#`\-*]|\d+\.)/.test(lines[i])) {
      para.push(lines[i]); i++;
    }
    blocks.push({ t: 'p', v: para.join(' ') });
  }

  return blocks.map((b, idx) => {
    if (b.t === 'p') return <p key={idx} style={S.paragraph}>{renderInline(b.v)}</p>;
    if (b.t === 'h1') return <h3 key={idx} style={S.h1}>{renderInline(b.v)}</h3>;
    if (b.t === 'h2') return <h4 key={idx} style={S.h2}>{renderInline(b.v)}</h4>;
    if (b.t === 'h3') return <h5 key={idx} style={S.h3}>{renderInline(b.v)}</h5>;
    if (b.t === 'ul') return <ul key={idx} style={S.list}>{b.items.map((it, i2) => <li key={i2} style={S.li}>{renderInline(it)}</li>)}</ul>;
    if (b.t === 'ol') return <ol key={idx} style={S.list}>{b.items.map((it, i2) => <li key={i2} style={S.li}>{renderInline(it)}</li>)}</ol>;
    if (b.t === 'code_block') return <pre key={idx} style={S.codeBlock}><code>{b.v}</code></pre>;
    return null;
  });
}

export default function AdvisorMessage({ message }) {
  const isUser = message.role === 'user';
  const blocks = Array.isArray(message.content)
    ? message.content
    : [{ type: 'text', text: message.content }];

  return (
    <div style={{ ...S.row, justifyContent: isUser ? 'flex-end' : 'flex-start' }}>
      <div style={{ ...S.bubble, ...(isUser ? S.userBubble : S.assistantBubble) }}>
        {blocks.map((b, idx) => {
          if (b.type === 'text') return <div key={idx}>{renderMarkdown(b.text)}</div>;
          if (b.type === 'tool_use') return <AdvisorToolCard key={idx} call={{ id: b.id, name: b.name, input: b.input, status: b.status || 'done' }} />;
          if (b.type === 'tool_result') {
            return (
              <AdvisorToolCard
                key={idx}
                call={{ id: b.tool_use_id, name: b.tool_name, input: null, result: b.content, status: b.is_error ? 'error' : 'done', isResult: true }}
              />
            );
          }
          return null;
        })}
      </div>
    </div>
  );
}

const S = {
  row: { display: 'flex', marginBottom: 10 },
  bubble: {
    maxWidth: '90%',
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 12.5,
    lineHeight: 1.55,
  },
  userBubble: { background: C.info, color: C.textInverse },
  assistantBubble: { background: C.surface, border: `1px solid ${C.borderLight}`, color: C.textPrimary },
  paragraph: { margin: '0 0 8px 0' },
  h1: { fontSize: 14, fontWeight: 800, margin: '6px 0 6px 0' },
  h2: { fontSize: 13, fontWeight: 700, margin: '6px 0 4px 0' },
  h3: { fontSize: 12, fontWeight: 700, letterSpacing: 0.3, textTransform: 'uppercase', margin: '6px 0 4px 0', color: 'var(--color-text-muted, #6B7280)' },
  list: { margin: '0 0 8px 16px', padding: 0 },
  li: { margin: '0 0 3px 0' },
  codeInline: { background: 'rgba(0,0,0,0.06)', padding: '1px 4px', borderRadius: 3, fontFamily: 'ui-monospace, "SFMono-Regular", Menlo, monospace', fontSize: 11.5 },
  codeBlock: { background: 'rgba(0,0,0,0.04)', padding: 8, borderRadius: 4, fontFamily: 'ui-monospace, Menlo, monospace', fontSize: 11, overflowX: 'auto', margin: '4px 0' },
  link: { color: C.info, textDecoration: 'underline' },
};
