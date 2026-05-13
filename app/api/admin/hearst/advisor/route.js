// app/api/admin/hearst/advisor/route.js
// SSE endpoint for the HEARST Advisor (Claude Opus 4.7) with prompt caching + tool use loop.
//
// Request:  POST { project_id, conversation_id?, messages: [...] }
//           messages are user-visible (role: 'user'|'assistant', content: string|array).
//           Tool_use/tool_result blocks live inside `assistant`/`user` array contents per Anthropic schema.
//
// Response: text/event-stream
//           Events: text_delta | tool_use | tool_result | message_done | done | error
//           Each event payload is JSON, one line per SSE message.

import Anthropic from '@anthropic-ai/sdk';
import { authedWrite } from '@/lib/supabase-admin';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { detectAlerts } from '@/lib/hearst-alerts';
import { TOOL_DEFS, runTool } from '@/lib/hearst-advisor-tools';
import { buildSystemPrompt, buildStateSnapshot } from '@/lib/hearst-advisor-prompt';
import { buildPageContextBlock } from '@/lib/hearst-page-context';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = 'claude-opus-4-7'; // Opus 4.7 — most capable for financial reasoning
const FALLBACK_MODELS = ['claude-opus-4-5', 'claude-sonnet-4-6', 'claude-3-5-sonnet-latest'];

// Simple in-memory rate limit (per process). Good enough for MVP single-tenant admin tool.
const RATE_LIMIT = { windowMs: 60_000, maxPerWindow: 20 };
const rateBucket = new Map();
function checkRate(actorId) {
  const now = Date.now();
  const cur = rateBucket.get(actorId) || { count: 0, resetAt: now + RATE_LIMIT.windowMs };
  if (now > cur.resetAt) { cur.count = 0; cur.resetAt = now + RATE_LIMIT.windowMs; }
  cur.count += 1;
  rateBucket.set(actorId, cur);
  return cur.count <= RATE_LIMIT.maxPerWindow;
}

function sseLine(payload) {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

async function loadFreshState(supa, project_id) {
  const [{ data: project }, { data: scenarios }, { data: sources }, { data: dataRoom }, { data: pipeline }] = await Promise.all([
    supa.from('hearst_projects').select('*').eq('id', project_id).single(),
    supa.from('hearst_scenarios').select('*').eq('project_id', project_id).order('created_at'),
    supa.from('hearst_sources').select('id, source_type').eq('project_id', project_id).limit(500),
    supa.from('hearst_data_room').select('id, status').eq('project_id', project_id),
    supa.from('hearst_pipeline').select('id, status, mw_requested').eq('project_id', project_id),
  ]);
  const enriched = (scenarios || []).map(s => ({ ...s, projection: generateProjection(s), source_score: calcSourceScore(s) }));
  const base = enriched.find(s => s.scenario_type === 'base') || enriched[0];
  const alerts = base ? detectAlerts(base, project) : [];
  return { project, scenarios: enriched, sources: sources || [], dataRoom: dataRoom || [], pipeline: pipeline || [], alerts };
}

async function getOrCreateConversation(supa, { conversation_id, project_id, actor_id }) {
  if (conversation_id) {
    const { data } = await supa.from('hearst_advisor_conversations').select('*').eq('id', conversation_id).single();
    if (data) return data;
  }
  const { data, error } = await supa
    .from('hearst_advisor_conversations')
    .insert({ project_id, actor_id, messages: [] })
    .select()
    .single();
  if (error) throw new Error('Could not create conversation: ' + error.message);
  return data;
}

async function saveConversation(supa, { id, messages, title }) {
  const updates = { messages, last_message_at: new Date().toISOString() };
  if (title) updates.title = title;
  await supa.from('hearst_advisor_conversations').update(updates).eq('id', id);
}

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });
  }

  if (!checkRate(auth.actor)) {
    return NextResponse.json({ error: 'Rate limit exceeded (20 messages/min)' }, { status: 429 });
  }

  const body = await req.json();
  const { project_id, conversation_id, messages: incoming, page_context } = body || {};
  if (!project_id) return NextResponse.json({ error: 'project_id required' }, { status: 400 });
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  const state = await loadFreshState(auth.supa, project_id);
  if (!state.project) return NextResponse.json({ error: 'project not found' }, { status: 404 });

  const conversation = await getOrCreateConversation(auth.supa, {
    conversation_id, project_id, actor_id: auth.actor,
  });

  // Auto-title from the first user message
  let title = conversation.title;
  if (!title) {
    const firstUser = incoming.find(m => m.role === 'user');
    if (firstUser) {
      const txt = typeof firstUser.content === 'string'
        ? firstUser.content
        : (firstUser.content || []).find(b => b.type === 'text')?.text || '';
      title = txt.slice(0, 80);
    }
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const pageBlock = buildPageContextBlock(page_context);
  const systemBlocks = [
    buildSystemPrompt(),       // persona, rules, vocab, public library, formulas, style — CACHED
    buildStateSnapshot(state), // dynamic project + scenarios snapshot
    ...(pageBlock ? [pageBlock] : []), // dynamic per-page context
  ];

  // Normalize incoming messages: ensure structured content
  let convo = incoming.map(m => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(sseLine(payload)));
      send({ type: 'conversation', conversation_id: conversation.id });

      let model = MODEL;
      let turn = 0;
      const MAX_TURNS = 8;
      try {
        while (turn < MAX_TURNS) {
          turn += 1;
          let messageStream;
          try {
            messageStream = anthropic.messages.stream({
              model,
              max_tokens: 8192,
              system: systemBlocks,
              tools: TOOL_DEFS,
              messages: convo,
            });
          } catch (err) {
            // Try fallback models on bad model id
            const fallback = FALLBACK_MODELS.find(m => m !== model);
            if (fallback) { model = fallback; turn -= 1; continue; }
            throw err;
          }

          let curBlockIdx = null;
          let curBlockType = null;
          let assistantBlocks = [];
          let toolUseBuf = {}; // index -> { id, name, input_json }

          for await (const event of messageStream) {
            if (event.type === 'content_block_start') {
              curBlockIdx = event.index;
              curBlockType = event.content_block.type;
              if (curBlockType === 'tool_use') {
                toolUseBuf[curBlockIdx] = { id: event.content_block.id, name: event.content_block.name, input_json: '' };
                send({ type: 'tool_use_start', id: event.content_block.id, name: event.content_block.name });
              } else if (curBlockType === 'text') {
                send({ type: 'text_start' });
              }
            } else if (event.type === 'content_block_delta') {
              if (event.delta.type === 'text_delta') {
                send({ type: 'text_delta', text: event.delta.text });
              } else if (event.delta.type === 'input_json_delta') {
                toolUseBuf[curBlockIdx].input_json += event.delta.partial_json;
              }
            } else if (event.type === 'content_block_stop') {
              if (curBlockType === 'tool_use') {
                const buf = toolUseBuf[curBlockIdx];
                let parsed = {};
                try { parsed = buf.input_json ? JSON.parse(buf.input_json) : {}; } catch { parsed = {}; }
                send({ type: 'tool_use', id: buf.id, name: buf.name, input: parsed });
              } else if (curBlockType === 'text') {
                send({ type: 'text_end' });
              }
              curBlockIdx = null;
              curBlockType = null;
            }
          }

          const finalMsg = await messageStream.finalMessage();
          assistantBlocks = finalMsg.content;
          convo.push({ role: 'assistant', content: assistantBlocks });

          // No more tool calls? we're done with this turn.
          const toolUses = assistantBlocks.filter(b => b.type === 'tool_use');
          if (toolUses.length === 0 || finalMsg.stop_reason !== 'tool_use') {
            send({ type: 'message_done', stop_reason: finalMsg.stop_reason, usage: finalMsg.usage });
            break;
          }

          // Run tools and feed results back
          const toolResultBlocks = [];
          for (const tu of toolUses) {
            let resultStr;
            let isError = false;
            try {
              resultStr = await runTool({
                name: tu.name,
                input: tu.input || {},
                supa: auth.supa,
                actor: auth.actor,
                project_id,
              });
            } catch (err) {
              isError = true;
              resultStr = JSON.stringify({ error: err.message || String(err) });
            }
            send({ type: 'tool_result', id: tu.id, name: tu.name, content: resultStr, is_error: isError });
            toolResultBlocks.push({
              type: 'tool_result',
              tool_use_id: tu.id,
              content: resultStr,
              ...(isError ? { is_error: true } : {}),
            });
          }
          convo.push({ role: 'user', content: toolResultBlocks });
        }

        if (turn >= MAX_TURNS) {
          send({ type: 'error', message: `Max ${MAX_TURNS} agentic turns reached. Conversation paused.` });
        }

        // Persist updated conversation
        await saveConversation(auth.supa, { id: conversation.id, messages: convo, title });
        send({ type: 'done' });
      } catch (err) {
        const msg = err?.message || String(err);
        send({ type: 'error', message: msg });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}

export async function GET(req) {
  // Return list of recent conversations for the current user (for the side panel history)
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;
  const { searchParams } = new URL(req.url);
  const project_id = searchParams.get('project_id');
  const conversation_id = searchParams.get('conversation_id');

  if (conversation_id) {
    const { data, error } = await auth.supa
      .from('hearst_advisor_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json({ conversation: data });
  }

  if (!project_id) return NextResponse.json({ error: 'project_id or conversation_id required' }, { status: 400 });

  const { data, error } = await auth.supa
    .from('hearst_advisor_conversations')
    .select('id, title, started_at, last_message_at, messages')
    .eq('project_id', project_id)
    .eq('actor_id', auth.actor)
    .order('last_message_at', { ascending: false })
    .limit(20);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  // Slim down: only return last_message preview, not full messages
  const slim = (data || []).map(c => ({
    id: c.id, title: c.title, started_at: c.started_at, last_message_at: c.last_message_at,
    message_count: Array.isArray(c.messages) ? c.messages.length : 0,
  }));
  return NextResponse.json({ conversations: slim });
}
