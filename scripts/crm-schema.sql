-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA
-- Schema: crm  (isolated from anything else in future-one project)
-- =====================================================================

create schema if not exists crm;

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type crm.pillar_t as enum ('datacenter', 'mining', 'hub');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.status_t as enum (
    'identified',
    'contacted',
    'in_discussion',
    'nda_signed',
    'loi',
    'term_sheet',
    'closed_won',
    'closed_lost'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.event_t as enum (
    'email_sent',
    'email_received',
    'call',
    'meeting',
    'document_sent',
    'document_received',
    'note',
    'status_change'
  );
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- OPERATORS
-- ---------------------------------------------------------------------
create table if not exists crm.operators (
  id              uuid primary key default gen_random_uuid(),
  pillar          crm.pillar_t not null,
  rank            text not null,           -- 'LEAD', '#2', '#3', or free
  name            text not null,
  country         text,
  role            text,                    -- 'HYPERSCALE PLATFORM' etc.
  one_liner       text,
  status          crm.status_t not null default 'identified',
  owner           text,                    -- internal owner (free text)
  next_step       text,
  next_step_due   date,
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists operators_pillar_idx on crm.operators (pillar);
create index if not exists operators_status_idx on crm.operators (status);

-- ---------------------------------------------------------------------
-- STAKEHOLDERS  (contacts on the operator side)
-- ---------------------------------------------------------------------
create table if not exists crm.stakeholders (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references crm.operators(id) on delete cascade,
  name            text not null,
  title           text,
  email           text,
  phone           text,
  notes           text,
  created_at      timestamptz not null default now()
);

create index if not exists stakeholders_operator_idx on crm.stakeholders (operator_id);

-- ---------------------------------------------------------------------
-- EVENTS  (timeline)
-- ---------------------------------------------------------------------
create table if not exists crm.events (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references crm.operators(id) on delete cascade,
  type            crm.event_t not null,
  subject         text,
  body            text,
  occurred_at     timestamptz not null default now(),
  created_at      timestamptz not null default now()
);

create index if not exists events_operator_idx on crm.events (operator_id);
create index if not exists events_occurred_idx on crm.events (occurred_at desc);

-- ---------------------------------------------------------------------
-- DOCUMENTS  (metadata; files live in Storage bucket `crm-documents`)
-- ---------------------------------------------------------------------
create table if not exists crm.documents (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references crm.operators(id) on delete cascade,
  name            text not null,
  kind            text,                    -- 'NDA', 'TERM_SHEET', 'DECK', 'OTHER'
  storage_path    text,                    -- bucket path
  external_url    text,                    -- if it's an external link
  uploaded_at     timestamptz not null default now()
);

create index if not exists documents_operator_idx on crm.documents (operator_id);

-- ---------------------------------------------------------------------
-- ACTIVITY LOG  (audit trail of status / field changes)
-- ---------------------------------------------------------------------
create table if not exists crm.activity_log (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid references crm.operators(id) on delete cascade,
  field           text not null,
  old_value       text,
  new_value       text,
  changed_at      timestamptz not null default now()
);

create index if not exists activity_operator_idx on crm.activity_log (operator_id);

-- ---------------------------------------------------------------------
-- TRIGGERS — auto updated_at + status audit
-- ---------------------------------------------------------------------
create or replace function crm.touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end; $$ language plpgsql;

drop trigger if exists operators_touch on crm.operators;
create trigger operators_touch
  before update on crm.operators
  for each row execute function crm.touch_updated_at();

create or replace function crm.log_status_change() returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into crm.activity_log (operator_id, field, old_value, new_value)
    values (new.id, 'status', old.status::text, new.status::text);
    insert into crm.events (operator_id, type, subject, body)
    values (new.id, 'status_change', 'Status changed',
            old.status::text || ' → ' || new.status::text);
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists operators_status_log on crm.operators;
create trigger operators_status_log
  after update on crm.operators
  for each row execute function crm.log_status_change();

-- ---------------------------------------------------------------------
-- RLS  — schema is reachable only via service_role from our Next.js API
-- We disable RLS (admin-only schema, never exposed to anon).
-- The /admin route is gated by middleware password; nothing client-side
-- ever uses anon to hit this schema.
-- ---------------------------------------------------------------------
alter table crm.operators     disable row level security;
alter table crm.stakeholders  disable row level security;
alter table crm.events        disable row level security;
alter table crm.documents     disable row level security;
alter table crm.activity_log  disable row level security;

-- Expose `crm` schema to PostgREST so service_role can use it
-- (anon role is NOT granted; only service_role can read/write)
grant usage on schema crm to service_role;
grant all on all tables in schema crm to service_role;
grant all on all sequences in schema crm to service_role;
alter default privileges in schema crm grant all on tables to service_role;
alter default privileges in schema crm grant all on sequences to service_role;
