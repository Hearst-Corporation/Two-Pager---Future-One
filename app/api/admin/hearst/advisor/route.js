// app/api/admin/hearst/advisor/route.js
// SSE endpoint for the HEARST Advisor (OpenAI-compatible — Hyperbolic / Kimi / etc.)
//
// Request:  POST { project_id, conversation_id?, messages: [...] }
//           messages are stored in Anthropic format (role, content array/text).
//           This route converts to/from OpenAI format on the fly.
//
// Response: text/event-stream
//           Events: text_delta | tool_use | tool_result | message_done | done | error
//           Each event payload is JSON, one line per SSE message.

import OpenAI from 'openai';
import { authedWrite } from '@/lib/supabase-admin';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { detectAlerts } from '@/lib/hearst-alerts';
import { TOOL_DEFS, toOpenAITools, runTool } from '@/lib/hearst-advisor-tools';
import { buildSystemPrompt, buildStateSnapshot } from '@/lib/hearst-advisor-prompt';
import { buildPageContextBlock } from '@/lib/hearst-page-context';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Model names for Kimi K2.5 / K2.6 on your endpoint
const MODEL = 'kimi-k2.5';
const FALLBACK_MODELS = ['kimi-k2.6'];

const BASE_URL = 'https://api.hypercli.com/v1';

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

// ──────────────────────────────────────────────────────────────────────────
// Format converters: Anthropic (DB storage) <-> OpenAI (API)
// ──────────────────────────────────────────────────────────────────────────

function toOpenAIMessages(anthropicMessages) {
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

function openAIAssistantToAnthropic(msg) {
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

// ──────────────────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────────────────

export async function POST(req) {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  if (!process.env.HYPERBOLIC_API_KEY) {
    return NextResponse.json({ error: 'HYPERBOLIC_API_KEY not configured on server' }, { status: 500 });
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

  const openai = new OpenAI({
    apiKey: process.env.HYPERBOLIC_API_KEY,
    baseURL: BASE_URL,
  });

  const pageBlock = buildPageContextBlock(page_context);
  const systemParts = [buildSystemPrompt(), buildStateSnapshot(state)];
  if (pageBlock) {
    systemParts.push(typeof pageBlock === 'string' ? pageBlock : pageBlock.text || JSON.stringify(pageBlock));
  }
  const systemPrompt = systemParts.join('\n\n');

  // Normalize incoming messages: ensure structured content for DB storage
  let convo = incoming.map(m => ({ role: m.role, content: m.content }));

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(sseLine(payload)));
      send({ type: 'conversation', conversation_id: conversation.id });

      let model = MODEL;
      let turn = 0;
      const MAX_TURNS = 8;
      let sentTextStart = false;
      const sentToolStart = new Set(); // indexes

      try {
        while (turn < MAX_TURNS) {
          turn += 1;

          let openaiMessages = toOpenAIMessages(convo);
          openaiMessages.unshift({ role: 'system', content: systemPrompt });

          let responseStream;
          try {
            responseStream = await openai.chat.completions.create({
              model,
              messages: openaiMessages,
              tools: toOpenAITools(TOOL_DEFS),
              tool_choice: 'auto',
              max_tokens: 8192,
              stream: true,
            });
          } catch (err) {
            // Try fallback models on bad model id
            const fallback = FALLBACK_MODELS.find(m => m !== model);
            if (fallback) { model = fallback; turn -= 1; continue; }
            throw err;
          }

          let assistantMsg = { role: 'assistant', content: '', tool_calls: [] };
          const toolCallBuffers = {}; // index -> { id, name, arguments }

          for await (const chunk of responseStream) {
            const delta = chunk.choices[0]?.delta;
            const finishReason = chunk.choices[0]?.finish_reason;

            // Text streaming
            if (delta?.content) {
              if (!sentTextStart) {
                send({ type: 'text_start' });
                sentTextStart = true;
              }
              assistantMsg.content += delta.content;
              send({ type: 'text_delta', text: delta.content });
            }

            // Tool call streaming
            if (delta?.tool_calls) {
              for (const tcDelta of delta.tool_calls) {
                const idx = tcDelta.index;
                if (!toolCallBuffers[idx]) {
                  toolCallBuffers[idx] = { id: '', name: '', arguments: '' };
                }
                if (tcDelta.id) toolCallBuffers[idx].id += tcDelta.id;
                if (tcDelta.function?.name) {
                  toolCallBuffers[idx].name += tcDelta.function.name;
                }
                if (tcDelta.function?.arguments) {
                  toolCallBuffers[idx].arguments += tcDelta.function.arguments;
                }

                // Send tool_use_start once we have an id
                if (toolCallBuffers[idx].id && !sentToolStart.has(idx)) {
                  send({ type: 'tool_use_start', id: toolCallBuffers[idx].id, name: toolCallBuffers[idx].name || '' });
                  sentToolStart.add(idx);
                }
              }
            }

            if (finishReason) {
              // Build final tool_calls from buffers
              const toolCalls = [];
              const indices = Object.keys(toolCallBuffers).map(Number).sort((a, b) => a - b);
              for (const idx of indices) {
                const buf = toolCallBuffers[idx];
                toolCalls.push({
                  id: buf.id || `call_${idx}_${Date.now()}`,
                  type: 'function',
                  function: {
                    name: buf.name,
                    arguments: buf.arguments,
                  },
                });
              }
              assistantMsg.tool_calls = toolCalls;

              if (finishReason === 'stop') {
                send({ type: 'text_end' });
              }
            }
          }

          // Convert OpenAI assistant message to Anthropic format for DB storage
          const anthropicAssistantMsg = openAIAssistantToAnthropic(assistantMsg);
          convo.push(anthropicAssistantMsg);

          // Check if we have tool calls
          const toolUses = anthropicAssistantMsg.content.filter(b => b.type === 'tool_use');
          if (toolUses.length === 0) {
            send({ type: 'message_done', stop_reason: 'end_turn', usage: {} });
            break;
          }

          // Send tool_use events to frontend (with parsed input)
          for (const tu of toolUses) {
            send({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input });
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

          // Reset streaming flags for next turn
          sentTextStart = false;
          sentToolStart.clear();
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
