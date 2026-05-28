// app/api/admin/hearst/advisor/route.js
// SSE endpoint for the HEARST Advisor (Claude Sonnet 4.6, native Anthropic SDK).
//
// Request:  POST { project_id, conversation_id?, messages: [...] }
//           messages are stored AND sent in Anthropic format (role, content blocks).
//
// Response: text/event-stream
//           Events: text_delta | tool_use | tool_result | message_done | done | error
//           Each event payload is JSON, one line per SSE message.
//           On client abort: `error` event is emitted then the stream closes
//           with EOF — no `done` event. Frontend must treat EOF after `error`
//           as terminal.

import { randomUUID } from 'node:crypto';
import Anthropic from '@anthropic-ai/sdk';
import { authedWrite } from '@/lib/supabase-admin';
import { generateProjection, calcSourceScore } from '@/lib/hearst-calculations';
import { detectAlerts } from '@/lib/hearst-alerts';
import { TOOL_DEFS, runTool } from '@/lib/hearst-advisor-tools';
import { buildSystemPrompt, buildStateSnapshot } from '@/lib/hearst-advisor-prompt';
import { buildOracleSystemPrompt, inferOracleContextFromPath } from '@/lib/oracle-system-prompt';
import { buildPageContextBlock } from '@/lib/hearst-page-context';
import { withValidation } from '@/lib/validators/withValidation';
import { AdvisorRequestSchema } from '@/lib/validators/hearst';
import { logger } from '@/lib/logger';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const MODEL = 'claude-sonnet-4-6';
const MAX_TOKENS = 8192;

// Hard timeout for upstream Anthropic calls. Must be strictly < maxDuration
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

// Sonnet 4.6 pricing: $3 / $15 per 1M tokens. Cache writes are 1.25× input
// (ephemeral 5-min TTL); cache reads are 0.1× input.
const SONNET_PRICING = {
  input: 3 / 1_000_000,
  output: 15 / 1_000_000,
  cache_write: 3.75 / 1_000_000,
  cache_read: 0.30 / 1_000_000,
};

function estimateCostUsd(usage) {
  if (!usage) return null;
  const input = Number(usage.input_tokens || 0);
  const output = Number(usage.output_tokens || 0);
  const cacheWrite = Number(usage.cache_creation_input_tokens || 0);
  const cacheRead = Number(usage.cache_read_input_tokens || 0);
  const cost =
    input * SONNET_PRICING.input +
    output * SONNET_PRICING.output +
    cacheWrite * SONNET_PRICING.cache_write +
    cacheRead * SONNET_PRICING.cache_read;
  return Number(cost.toFixed(6));
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

// ──────────────────────────────────────────────────────────────────────────
// POST handler
// ──────────────────────────────────────────────────────────────────────────

export const POST = withValidation(AdvisorRequestSchema, async (req, parsed) => {
  const auth = await authedWrite('editor');
  if (auth instanceof NextResponse) return auth;

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json({ error: 'ANTHROPIC_API_KEY not configured on server' }, { status: 500 });
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
  //   - the controller is passed to every anthropic.messages.stream({ signal })
  //     so when the client disconnects the upstream Anthropic request aborts
  //     immediately instead of hanging until Vercel kills the lambda at maxDuration.
  //   - SDK-level `timeout` + `maxRetries: 2` belt-and-suspenders for transient 5xx.
  const abortController = new AbortController();
  const onClientAbort = () => abortController.abort();
  if (req?.signal) {
    if (req.signal.aborted) abortController.abort();
    else req.signal.addEventListener('abort', onClientAbort);
  }

  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
    timeout: UPSTREAM_TIMEOUT_MS,
    maxRetries: 2,
  });

  // ── ORACLE constitutional reasoning layer (Sprint 0) ───────────────
  // Inséré en tête du persona Advisor : aligne les 11 sections, 6 perspectives,
  // stakeholder/region/overlays. Cache_control ephemeral ensure prompt-caching.
  const oracleCtx = {
    ...inferOracleContextFromPath('/admin/hearst'),
    stakeholder: body?.oracle?.stakeholder,
    region: body?.oracle?.region,
    overlays: body?.oracle?.overlays,
    brevity: 'standard',
    surface: 'hearst-advisor',
    product_context: 'Hearst Oracle — investment simulator + CRM pipeline',
  };
  const oraclePrefix = buildOracleSystemPrompt(oracleCtx);

  // System blocks with prompt-caching breakpoints.
  // Render order is: tools → system → messages. A cache_control on a system
  // block also caches everything before it (tools), so two breakpoints give:
  //   #1 (after static prompt)  → tools + persona/rules (stable across all requests)
  //   #2 (after state snapshot) → +state (stable across turns within one request)
  // Page context comes last and is intentionally uncached (varies per request).
  const systemBlocks = [
    { type: 'text', text: oraclePrefix, cache_control: { type: 'ephemeral' } },
    { type: 'text', text: buildSystemPrompt(), cache_control: { type: 'ephemeral' } },
    { type: 'text', text: buildStateSnapshot(state), cache_control: { type: 'ephemeral' } },
  ];
  const pageBlock = buildPageContextBlock(page_context);
  if (pageBlock) {
    const pageText = typeof pageBlock === 'string' ? pageBlock : pageBlock.text || JSON.stringify(pageBlock);
    systemBlocks.push({ type: 'text', text: pageText });
  }

  // DB storage matches the API wire format — no conversion needed.
  let convo = incoming.map(m => ({ role: m.role, content: m.content }));

  // Run-level telemetry. We push to toolCallLog inside the loop and persist a
  // single row to hearst_advisor_logs at the very end (try/catch in
  // persistRunLog() ensures table-absent or transient errors never throw here).
  const runId = randomUUID();
  const runStartedAt = Date.now();
  const inputMessagesCount = incoming.length;
  const toolCallLog = []; // [{ name, args_summary, ok, duration_ms }]
  let usageTotals = {
    input_tokens: 0,
    output_tokens: 0,
    cache_creation_input_tokens: 0,
    cache_read_input_tokens: 0,
  };
  let runStatus = 'completed';
  let errorType = null;
  let errorMessage = null;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (payload) => controller.enqueue(encoder.encode(sseLine(payload)));
      send({ type: 'conversation', conversation_id: conversation.id });

      let turn = 0;
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

          const messageStream = anthropic.messages.stream(
            {
              model: MODEL,
              max_tokens: MAX_TOKENS,
              system: systemBlocks,
              tools: TOOL_DEFS,
              messages: convo,
            },
            { signal: abortController.signal },
          );

          // Tool blocks accumulate their JSON across input_json_delta events.
          // The block's id + name arrive on content_block_start so we can emit
          // tool_use_start immediately, before the JSON is fully assembled.
          const toolBlocks = {}; // index -> { id, name }
          let sentTextStart = false;

          for await (const event of messageStream) {
            if (event.type === 'content_block_start') {
              const block = event.content_block;
              if (block.type === 'text') {
                if (!sentTextStart) {
                  send({ type: 'text_start' });
                  sentTextStart = true;
                }
              } else if (block.type === 'tool_use') {
                toolBlocks[event.index] = { id: block.id, name: block.name };
                send({ type: 'tool_use_start', id: block.id, name: block.name });
              }
            } else if (event.type === 'content_block_delta') {
              const delta = event.delta;
              if (delta.type === 'text_delta') {
                if (!sentTextStart) {
                  send({ type: 'text_start' });
                  sentTextStart = true;
                }
                send({ type: 'text_delta', text: delta.text });
              }
              // input_json_delta is accumulated by the SDK — we read the
              // final parsed input from finalMessage().content[].input
            }
            // content_block_stop / message_delta / message_stop are reflected
            // in finalMessage() — no per-event handling needed here.
          }

          const finalMessage = await messageStream.finalMessage();

          if (sentTextStart) send({ type: 'text_end' });

          // Accumulate usage (cache stats included). Note that Anthropic returns
          // input_tokens as the count NOT served from cache — the cached prefix
          // is reported separately under cache_read_input_tokens.
          const u = finalMessage.usage || {};
          usageTotals.input_tokens += Number(u.input_tokens || 0);
          usageTotals.output_tokens += Number(u.output_tokens || 0);
          usageTotals.cache_creation_input_tokens += Number(u.cache_creation_input_tokens || 0);
          usageTotals.cache_read_input_tokens += Number(u.cache_read_input_tokens || 0);

          // finalMessage.content is already in Anthropic block format — store as-is.
          const assistantBlocks = finalMessage.content;
          convo.push({ role: 'assistant', content: assistantBlocks });

          const toolUses = assistantBlocks.filter(b => b.type === 'tool_use');
          if (toolUses.length === 0) {
            send({
              type: 'message_done',
              stop_reason: finalMessage.stop_reason || 'end_turn',
              usage: usageTotals,
            });
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
                const parsedRes = JSON.parse(resultStr);
                if (parsedRes && (parsedRes.ok === false || parsedRes.error)) isError = true;
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
        errorType = err?.name || err?.type || (aborted ? 'AbortError' : 'UnknownError');
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
          model: MODEL,
          status: runStatus,
          input_messages_count: inputMessagesCount,
          tool_calls: toolCallLog,
          input_tokens: usageTotals.input_tokens,
          output_tokens: usageTotals.output_tokens,
          total_tokens: usageTotals.input_tokens + usageTotals.output_tokens,
          latency_ms: Date.now() - runStartedAt,
          error_type: errorType,
          error_message: errorMessage,
          cost_usd_estimate: estimateCostUsd(usageTotals),
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
