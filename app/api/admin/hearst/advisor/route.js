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
//           On client abort: `error` event is emitted then the stream closes
//           with EOF — no `done` event. Frontend must treat EOF after `error`
//           as terminal.

import { randomUUID } from 'node:crypto';
import OpenAI from 'openai';
import { authedWrite } from '@/lib/supabase-admin';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { detectAlerts } from '@/lib/hearst-alerts';
import { TOOL_DEFS, toOpenAITools, runTool } from '@/lib/hearst-advisor-tools';
import { buildSystemPrompt, buildStateSnapshot } from '@/lib/hearst-advisor-prompt';
import { buildPageContextBlock } from '@/lib/hearst-page-context';
import { withValidation } from '@/lib/validators/withValidation';
import { AdvisorRequestSchema } from '@/lib/validators/hearst';
import { logger } from '@/lib/logger';
import { toOpenAIMessages, openAIAssistantToAnthropic } from '@/lib/advisor-format';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

// Model names for Kimi K2.5 / K2.6 on your endpoint
const MODEL = 'kimi-k2.5';
const FALLBACK_MODELS = ['kimi-k2.6'];

const BASE_URL = 'https://api.hypercli.com/v1';

// Hard timeout for upstream OpenAI/Hyperbolic calls. Must be strictly < maxDuration
// so we surface a clean "upstream stalled" error before Vercel kills the lambda.
const UPSTREAM_TIMEOUT_MS = 60_000;

// Loop bounds. MAX_TOOL_TURNS keeps the original 8-turn ceiling; MAX_TOTAL_TOOL_CALLS
// catches degenerate cases where the model spins inside one turn or across turns.
const MAX_TOOL_TURNS = 8;
const MAX_TOTAL_TOOL_CALLS = 15;

// Rate limit window/policy. Buckets are persisted to Supabase
// (table `llm_rate_buckets`) so the limit survives serverless cold starts and
// scales horizontally. See checkRateLimit().
const RATE_WINDOW_MS = 60_000;
const RATE_MAX_PER_WINDOW = 20;

// Pricing estimates for cost telemetry. These are PLACEHOLDERS — the
// numbers below are illustrative, NOT confirmed against Hyperbolic's invoices.
// TODO: confirm pricing with Hyperbolic dashboard before trusting cost_usd_estimate
// in any external dashboard or budget alert.
const KIMI_PRICING = {
  'kimi-k2.5': { input: 0.0002 / 1000, output: 0.0008 / 1000 },
  'kimi-k2.6': { input: 0.0003 / 1000, output: 0.001 / 1000 },
};

function estimateCostUsd(model, inputTokens, outputTokens) {
  const p = KIMI_PRICING[model];
  if (!p) return null;
  const inT = Number(inputTokens) || 0;
  const outT = Number(outputTokens) || 0;
  return Number((inT * p.input + outT * p.output).toFixed(6));
}

// Postgres "undefined_table" SQLSTATE. We treat this as a missing migration
// (table-not-created-yet) and fail-open so the advisor keeps working until A5
// applies the migration. Any other Supabase error is logged but we still
// fail-open to avoid locking users out from a metrics/audit failure.
const PG_UNDEFINED_TABLE = '42P01';

// Supabase-backed rate limit. Replaces the previous in-memory Map.
//
// Returns { allowed: true } on green light, or { allowed: false, retryAfter: <seconds> }
// when the actor has exceeded RATE_MAX_PER_WINDOW within RATE_WINDOW_MS.
//
// Failure modes:
//   - Table doesn't exist (42P01) → WARN + fail-open. Intentional: a missing
//     migration must NOT take down the advisor for everyone.
//   - Any other error → WARN + fail-open. Surfacing a 500 here would block the
//     user on infrastructure noise; we'd rather burn a few free requests.
async function checkRateLimit(actorId, supa) {
  if (!actorId) return { allowed: true };
  const nowMs = Date.now();
  const windowStart = new Date(nowMs - (nowMs % RATE_WINDOW_MS));
  try {
    const { data: existing, error: selectErr } = await supa
      .from('llm_rate_buckets')
      .select('user_id, window_started_at, request_count')
      .eq('user_id', actorId)
      .maybeSingle();

    if (selectErr) {
      if (selectErr.code === PG_UNDEFINED_TABLE) {
        logger.warn({
          area: 'advisor.rate_limit', event: 'table_missing',
          table: 'llm_rate_buckets', fail_mode: 'open', actor_id: actorId,
        });
        return { allowed: true };
      }
      logger.warn({
        area: 'advisor.rate_limit', event: 'select_error',
        fail_mode: 'open', actor_id: actorId, error_code: selectErr.code, error_message: selectErr.message,
      });
      return { allowed: true };
    }

    const sameWindow = existing && new Date(existing.window_started_at).getTime() === windowStart.getTime();
    const nextCount = sameWindow ? (existing.request_count || 0) + 1 : 1;

    if (nextCount > RATE_MAX_PER_WINDOW) {
      const windowEndMs = windowStart.getTime() + RATE_WINDOW_MS;
      const retryAfter = Math.max(1, Math.ceil((windowEndMs - nowMs) / 1000));
      return { allowed: false, retryAfter };
    }

    const { error: upsertErr } = await supa
      .from('llm_rate_buckets')
      .upsert({
        user_id: actorId,
        window_started_at: windowStart.toISOString(),
        request_count: nextCount,
      }, { onConflict: 'user_id' });

    if (upsertErr) {
      if (upsertErr.code === PG_UNDEFINED_TABLE) {
        logger.warn({
          area: 'advisor.rate_limit', event: 'table_missing',
          table: 'llm_rate_buckets', fail_mode: 'open', actor_id: actorId,
        });
      } else {
        logger.warn({
          area: 'advisor.rate_limit', event: 'upsert_error',
          fail_mode: 'open', actor_id: actorId, error_code: upsertErr.code, error_message: upsertErr.message,
        });
      }
    }
    return { allowed: true };
  } catch (err) {
    logger.warn({
      area: 'advisor.rate_limit', event: 'unexpected_error',
      fail_mode: 'open', actor_id: actorId, error_message: err?.message || String(err),
    });
    return { allowed: true };
  }
}

// Persist a single run's telemetry to hearst_advisor_logs. Fails silently
// (warn-and-swallow) so a missing migration or a transient DB hiccup never
// breaks the user-facing stream. Caller has already sent `done`/`error` to
// the client before this is awaited.
async function persistRunLog(supa, row) {
  try {
    const { error } = await supa.from('hearst_advisor_logs').insert(row);
    if (error) {
      logger.warn({
        area: 'advisor.run_log', event: 'insert_error',
        error_code: error.code, error_message: error.message,
        run_id: row.run_id, user_id: row.user_id, status: row.status,
      });
    }
  } catch (err) {
    logger.warn({
      area: 'advisor.run_log', event: 'insert_threw',
      error_message: err?.message || String(err),
      run_id: row.run_id, user_id: row.user_id, status: row.status,
    });
  }
}

function summarizeArgs(input) {
  // Cap the audit summary so we don't bloat the log with full prompts.
  try {
    const s = JSON.stringify(input ?? {});
    return s.length > 500 ? s.slice(0, 497) + '...' : s;
  } catch { return null; }
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

// Format converters between Anthropic blocks (DB storage) and OpenAI
// chat-completion shape (upstream API) live in lib/advisor-format.js — they
// are pure and unit-tested there.

// ──────────────────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────────────────

export const POST = withValidation(AdvisorRequestSchema, async (req, parsed) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  if (!process.env.HYPERBOLIC_API_KEY) {
    return NextResponse.json({ error: 'HYPERBOLIC_API_KEY not configured on server' }, { status: 500 });
  }

  const rate = await checkRateLimit(auth.actor, auth.supa);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: `Rate limit exceeded (${RATE_MAX_PER_WINDOW} messages/min)`, retry_after: rate.retryAfter },
      { status: 429, headers: { 'Retry-After': String(rate.retryAfter) } },
    );
  }

  // Zod-validated body (AdvisorRequestSchema). project_id presence is already
  // enforced by the wrapper. The schema accepts EITHER a singular `message: string`
  // OR a canonical `messages: [...]` array (Anthropic block format); the route
  // normalises the singular form into `incoming` below so the rest of the handler
  // operates on a uniform messages array. Redundant runtime checks below remain
  // as belt-and-suspenders in case the schema later relaxes constraints.
  let { project_id, conversation_id, messages: incoming, page_context } = parsed;
  const singleMessage = parsed.message;
  if ((!incoming || incoming.length === 0) && singleMessage) {
    incoming = [{ role: 'user', content: [{ type: 'text', text: singleMessage }] }];
  }
  if (!Array.isArray(incoming) || incoming.length === 0) {
    return NextResponse.json({ error: 'no_messages' }, { status: 400 });
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

  // Abort propagation:
  //   - request.signal (client disconnect) → aborts the controller
  //   - the controller is passed to every openai.chat.completions.create({ signal })
  //     so when the client disconnects, the upstream Hyperbolic request aborts
  //     immediately instead of hanging until Vercel kills the lambda at maxDuration.
  //   - SDK-level `timeout` + `maxRetries: 0` is the second line of defence: if the
  //     upstream stalls without the client disconnecting, we still bail at 60s.
  const abortController = new AbortController();
  const onClientAbort = () => abortController.abort();
  if (req?.signal) {
    if (req.signal.aborted) abortController.abort();
    else req.signal.addEventListener('abort', onClientAbort);
  }

  const openai = new OpenAI({
    apiKey: process.env.HYPERBOLIC_API_KEY,
    baseURL: BASE_URL,
    timeout: UPSTREAM_TIMEOUT_MS,
    maxRetries: 0,
  });

  const pageBlock = buildPageContextBlock(page_context);
  const systemParts = [buildSystemPrompt(), buildStateSnapshot(state)];
  if (pageBlock) {
    systemParts.push(typeof pageBlock === 'string' ? pageBlock : pageBlock.text || JSON.stringify(pageBlock));
  }
  const systemPrompt = systemParts.join('\n\n');

  // Normalize incoming messages: ensure structured content for DB storage
  let convo = incoming.map(m => ({ role: m.role, content: m.content }));

  // Run-level telemetry. We push to toolCallLog inside the loop and persist a
  // single row to hearst_advisor_logs at the very end (try/catch in
  // persistRunLog() ensures table-absent or transient errors never throw here).
  const runId = randomUUID();
  const runStartedAt = Date.now();
  const inputMessagesCount = incoming.length;
  const toolCallLog = []; // [{ name, args_summary, ok, duration_ms }]
  let usageTotals = { input_tokens: 0, output_tokens: 0, total_tokens: 0 };
  let modelUsed = MODEL;
  let runStatus = 'completed';
  let errorType = null;
  let errorMessage = null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(sseLine(payload)));
      send({ type: 'conversation', conversation_id: conversation.id });

      let model = MODEL;
      let turn = 0;
      let sentTextStart = false;
      const sentToolStart = new Set(); // indexes
      // Tracks the previous tool invocation to detect identical back-to-back calls.
      let prevToolSignature = null;

      try {
        while (turn < MAX_TOOL_TURNS) {
          turn += 1;

          if (abortController.signal.aborted) {
            runStatus = 'aborted';
            errorType = 'client_abort';
            errorMessage = 'client disconnected';
            send({ type: 'error', message: 'client aborted' });
            // The client has gone away; persisting the (incomplete) conversation
            // and emitting a `done` event would be both wasteful and a protocol
            // contradiction (`error` and `done` should never both fire for one
            // run). Bail out — the `finally` block still runs persistRunLog().
            return;
          }

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
              stream_options: { include_usage: true },
            }, { signal: abortController.signal });
          } catch (err) {
            // Try fallback models on bad model id
            const fallback = FALLBACK_MODELS.find(m => m !== model);
            const isBadModel = /model/i.test(err?.message || '') && /not.*found|invalid|bad/i.test(err?.message || '');
            if (fallback && isBadModel) { model = fallback; modelUsed = fallback; turn -= 1; continue; }
            throw err;
          }

          let assistantMsg = { role: 'assistant', content: '', tool_calls: [] };
          const toolCallBuffers = {}; // index -> { id, name, arguments }

          for await (const chunk of responseStream) {
            // Capture usage if present (final chunk when stream_options.include_usage = true).
            if (chunk.usage) {
              usageTotals.input_tokens += Number(chunk.usage.prompt_tokens || 0);
              usageTotals.output_tokens += Number(chunk.usage.completion_tokens || 0);
              usageTotals.total_tokens += Number(chunk.usage.total_tokens || 0);
            }

            const delta = chunk.choices?.[0]?.delta;
            const finishReason = chunk.choices?.[0]?.finish_reason;

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
            send({ type: 'message_done', stop_reason: 'end_turn', usage: usageTotals || {} });
            break;
          }

          // Loop guard #1: identical back-to-back tool call(s) strongly
          // suggests the model is stuck. We compute a stable signature for the
          // whole turn — concatenating sorted per-tool signatures — so that a
          // multi-tool turn followed by an identical multi-tool turn (or a
          // single-tool follow-up matching the previous single-tool turn) is
          // also caught. Sorting makes the signature invariant to call order.
          // TODO: relax to only trigger when both turns are pure-read tools — current
          // guard false-positives on legitimate read-after-write verify patterns.
          const currentSignature = toolUses
            .map((t) => `${t.name}:${JSON.stringify(t.input || {})}`)
            .sort()
            .join('||');
          const stuck = Boolean(currentSignature) && prevToolSignature === currentSignature;
          prevToolSignature = currentSignature;

          if (stuck) {
            const tu = toolUses[0];
            const errPayload = JSON.stringify({
              ok: false,
              error: 'duplicate_tool_call',
              message: `Tool ${tu.name} called twice with identical args — likely stuck, please choose a different action.`,
            });
            send({ type: 'tool_use', id: tu.id, name: tu.name, input: tu.input });
            send({ type: 'tool_result', id: tu.id, name: tu.name, content: errPayload, is_error: true });
            convo.push({ role: 'user', content: [{ type: 'tool_result', tool_use_id: tu.id, content: errPayload, is_error: true }] });
            toolCallLog.push({ name: tu.name, args_summary: summarizeArgs(tu.input), ok: false, duration_ms: 0 });
            runStatus = 'failed';
            errorType = 'duplicate_tool_call';
            errorMessage = `Tool ${tu.name} called twice with identical args`;
            send({ type: 'error', message: errorMessage });
            break;
          }

          // Loop guard #2: hard cap on total tool calls across the whole run.
          if (toolCallLog.length + toolUses.length > MAX_TOTAL_TOOL_CALLS) {
            runStatus = 'failed';
            errorType = 'max_tool_calls_exceeded';
            errorMessage = `Total tool calls would exceed ${MAX_TOTAL_TOOL_CALLS}`;
            send({ type: 'error', message: 'max_tool_calls_exceeded' });
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
            const tStart = Date.now();
            try {
              resultStr = await runTool({
                name: tu.name,
                input: tu.input || {},
                supa: auth.supa,
                actor: auth.actor,
                project_id,
              });
              // Surface tool-level `ok: false` (e.g., rationale_too_short) so it
              // shows up correctly in the audit log without breaking the stream.
              try {
                const parsed = JSON.parse(resultStr);
                if (parsed && (parsed.ok === false || parsed.error)) isError = true;
              } catch { /* not JSON, treat as success */ }
            } catch (err) {
              isError = true;
              resultStr = JSON.stringify({ error: err.message || String(err) });
            }
            const duration = Date.now() - tStart;
            toolCallLog.push({
              name: tu.name,
              args_summary: summarizeArgs(tu.input),
              ok: !isError,
              duration_ms: duration,
            });
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

        if (turn >= MAX_TOOL_TURNS && runStatus === 'completed') {
          runStatus = 'failed';
          errorType = 'max_turns_reached';
          errorMessage = `Max ${MAX_TOOL_TURNS} agentic turns reached`;
          send({ type: 'error', message: `Max ${MAX_TOOL_TURNS} agentic turns reached. Conversation paused.` });
        }

        // Persist updated conversation
        await saveConversation(auth.supa, { id: conversation.id, messages: convo, title });
        send({ type: 'done' });
      } catch (err) {
        const aborted = abortController.signal.aborted || /aborted|abort/i.test(err?.name || err?.message || '');
        runStatus = aborted ? 'aborted' : 'failed';
        errorType = err?.name || (aborted ? 'AbortError' : 'UnknownError');
        errorMessage = err?.message || String(err);
        send({ type: 'error', message: errorMessage });
      } finally {
        // Detach client-abort listener so we don't leak handlers.
        if (req?.signal) {
          try { req.signal.removeEventListener('abort', onClientAbort); } catch { /* noop */ }
        }
        controller.close();

        // Persist run telemetry. Awaiting after controller.close() is fine here
        // because Next.js keeps the lambda alive until the start() promise
        // settles. persistRunLog() warn-and-swallows on any error.
        const completedAt = new Date();
        await persistRunLog(auth.supa, {
          user_id: auth.actor,
          conversation_id: conversation.id,
          project_id,
          run_id: runId,
          model: modelUsed,
          status: runStatus,
          input_messages_count: inputMessagesCount,
          tool_calls: toolCallLog,
          input_tokens: usageTotals.input_tokens,
          output_tokens: usageTotals.output_tokens,
          total_tokens: usageTotals.total_tokens,
          latency_ms: Date.now() - runStartedAt,
          error_type: errorType,
          error_message: errorMessage,
          cost_usd_estimate: estimateCostUsd(modelUsed, usageTotals.input_tokens, usageTotals.output_tokens),
          created_at: new Date(runStartedAt).toISOString(),
          completed_at: completedAt.toISOString(),
        });
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
});

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
      .eq('actor_id', auth.actor)
      .single();
    // PGRST116 = PostgREST "no rows returned" from .single(). Treat as 404
    // explicitly so an IDOR probe (valid id but belongs to another actor) is
    // indistinguishable from a real not-found, and a genuine DB failure
    // (table missing, network, etc.) surfaces as 500 instead of being
    // misclassified as 404.
    if (error?.code === 'PGRST116' || (!data && !error)) {
      return NextResponse.json({ error: 'not_found' }, { status: 404 });
    }
    if (error) {
      return NextResponse.json({ error: 'lookup_failed' }, { status: 500 });
    }
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
