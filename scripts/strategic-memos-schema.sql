-- crm.strategic_memos — persistent institutional strategic memos.
-- Critical Deliverables branch (P1/P2/P3/P6/P7).
--
-- Append-only by design: each (re)generation inserts a NEW versioned row keyed
-- to a scenario_id; rows are never overwritten. This gives versioning (P2),
-- the scenario -> many-memos relationship (P3), lifecycle status (P6) and a
-- reconstructable audit trail (P7: created_by, created_at, provider_used,
-- scenario_id, version all live on the row).
--
-- Applied to project zrvlmhuymhyrzonnihce (future-one) via migration
-- `create_strategic_memos`. This file is the repo record.

create table if not exists crm.strategic_memos (
  id                  uuid primary key default gen_random_uuid(),
  project_id          uuid references crm.hearst_projects(id) on delete set null,
  scenario_id         uuid references crm.hearst_scenarios(id) on delete set null,
  title               text not null,
  executive_summary   text,
  memo_json           jsonb not null,
  memo_markdown       text,
  stakeholder         text,
  region              text,
  audience            text,
  provider_used       text,
  generation_time_ms  integer,
  confidence_level    text,
  data_as_of          text,
  status              text not null default 'draft' check (status in ('draft','reviewed','approved','archived')),
  version             integer not null default 1,
  created_by          uuid references crm.profiles(id) on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index if not exists idx_strategic_memos_scenario on crm.strategic_memos(scenario_id);
create index if not exists idx_strategic_memos_project  on crm.strategic_memos(project_id);
create index if not exists idx_strategic_memos_created  on crm.strategic_memos(created_at desc);
