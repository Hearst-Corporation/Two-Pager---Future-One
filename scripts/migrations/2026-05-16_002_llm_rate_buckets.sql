-- =====================================================================
-- LLM RATE BUCKETS — persistent per-user rate-limiter state
-- Author: A5 (additive migration sprint 2026-05-16)
-- ADDITIVE ONLY. Safe to re-run. No DROP, no destructive ALTER.
-- =====================================================================
--
-- Consumed by agent A4's rate limiter: one row per user, upserted on
-- every /api/hearst/advisor request. window_started_at marks the start
-- of the current sliding window; request_count is bumped each call.
-- A janitor function trims rows older than 5 minutes.
-- =====================================================================

-- ---------------------------------------------------------------------
-- TABLE — llm_rate_buckets
-- ---------------------------------------------------------------------
create table if not exists public.llm_rate_buckets (
  user_id            uuid primary key,
  window_started_at  timestamptz not null,
  request_count      int not null default 0,
  updated_at         timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- RLS — enabled, no policies (service_role bypasses RLS)
-- ---------------------------------------------------------------------
alter table public.llm_rate_buckets enable row level security;

-- ---------------------------------------------------------------------
-- GRANTS — service_role only
-- ---------------------------------------------------------------------
grant select, insert, update, delete on public.llm_rate_buckets to service_role;

-- ---------------------------------------------------------------------
-- GC FUNCTION — sweep stale rate buckets
-- ---------------------------------------------------------------------
create or replace function public.gc_llm_rate_buckets() returns void
language sql security definer as $$
  delete from public.llm_rate_buckets where window_started_at < now() - interval '5 minutes';
$$;

revoke all on function public.gc_llm_rate_buckets() from public;
grant execute on function public.gc_llm_rate_buckets() to service_role;
