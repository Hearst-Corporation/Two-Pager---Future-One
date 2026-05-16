-- =====================================================================
-- HEARST ADVISOR LOGS — persistent audit trail for every LLM run
-- Author: A5 (additive migration sprint 2026-05-16)
-- ADDITIVE ONLY. Safe to re-run. No DROP, no destructive ALTER.
-- =====================================================================
--
-- Consumed by agent A4's /api/hearst/advisor endpoint: every model
-- invocation (successful, failed, aborted, or timed out) inserts one row.
-- service_role bypasses RLS, so no policies needed; RLS stays ON to
-- harden against accidental anon/authenticated exposure.
-- =====================================================================

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- TABLE — hearst_advisor_logs
-- ---------------------------------------------------------------------
create table if not exists public.hearst_advisor_logs (
  id                    uuid primary key default gen_random_uuid(),
  run_id                uuid not null unique,
  user_id               uuid not null,
  conversation_id       uuid,
  project_id            uuid not null,
  model                 text not null,
  status                text not null
    check (status in ('completed', 'failed', 'aborted', 'timeout')),
  input_messages_count  int  not null default 0,
  tool_calls            jsonb not null default '[]'::jsonb,
  input_tokens          int,
  output_tokens         int,
  total_tokens          int,
  latency_ms            int,
  error_type            text,
  error_message         text,
  cost_usd_estimate     numeric(10,6),
  created_at            timestamptz not null default now(),
  completed_at          timestamptz
);

-- ---------------------------------------------------------------------
-- INDEXES
-- ---------------------------------------------------------------------
-- Per-user history (most common query)
create index if not exists hearst_advisor_logs_user_created_idx
  on public.hearst_advisor_logs (user_id, created_at desc);

-- Project-level audit
create index if not exists hearst_advisor_logs_project_created_idx
  on public.hearst_advisor_logs (project_id, created_at desc);

-- Partial index for error monitoring (small, hot)
create index if not exists hearst_advisor_logs_status_errors_idx
  on public.hearst_advisor_logs (status)
  where status <> 'completed';

-- Global recent activity feed
create index if not exists hearst_advisor_logs_created_idx
  on public.hearst_advisor_logs (created_at desc);

-- ---------------------------------------------------------------------
-- RLS — enabled, no policies (service_role bypasses RLS)
-- ---------------------------------------------------------------------
alter table public.hearst_advisor_logs enable row level security;

-- ---------------------------------------------------------------------
-- GRANTS — service_role only
-- ---------------------------------------------------------------------
grant select, insert on public.hearst_advisor_logs to service_role;
