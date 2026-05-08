-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA v3
-- Adds the ROADMAP layer:
--   - workstreams (6)
--   - initiatives (the actual roadmap items)
--   - partners (institutional: Meeza, QF, QFZ — distinct from operators)
--   - initiative_operators (M:N link)
--   - initiative_partners  (M:N link)
-- =====================================================================

-- ---------------------------------------------------------------------
-- ENUMS
-- ---------------------------------------------------------------------
do $$ begin
  create type crm.owner_entity_t as enum ('hearst', 'jv', 'you', 'partner', 'joint');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.init_status_t as enum (
    'not_started',
    'planned',
    'in_progress',
    'blocked',
    'done',
    'archived'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.init_priority_t as enum ('low', 'medium', 'high', 'critical');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- WORKSTREAMS  (6 fixed; rows are seeded)
-- ---------------------------------------------------------------------
create table if not exists crm.workstreams (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null unique,            -- 'land-power' | 'data-centres' | 'mining-digital' | 'financials' | 'contract' | 'technical' | 'commercial'
  code        text not null,                   -- 'WS1' .. 'WS7'
  label       text not null,                   -- 'Land & Power'
  tagline     text,
  accent      text,                            -- hex color, displayed on cards
  ordering    int not null default 0,
  created_at  timestamptz not null default now()
);

create index if not exists workstreams_order_idx on crm.workstreams (ordering);

-- ---------------------------------------------------------------------
-- PARTNERS  (institutional partners — Meeza, QF, QFZ, etc.)
-- ---------------------------------------------------------------------
create table if not exists crm.partners (
  id              uuid primary key default gen_random_uuid(),
  name            text not null,
  kind            text not null default 'institution', -- 'institution' | 'authority' | 'sponsor' | 'foundation'
  country         text default 'Qatar',
  one_liner       text,
  status          crm.status_t not null default 'identified',
  owner           text,
  next_step       text,
  next_step_due   date,
  notes           text,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists partners_status_idx on crm.partners (status);

drop trigger if exists partners_touch on crm.partners;
create trigger partners_touch
  before update on crm.partners
  for each row execute function crm.touch_updated_at();

-- ---------------------------------------------------------------------
-- INITIATIVES  (the roadmap items)
-- ---------------------------------------------------------------------
create table if not exists crm.initiatives (
  id              uuid primary key default gen_random_uuid(),
  workstream_id   uuid not null references crm.workstreams(id) on delete restrict,
  code            text,                                -- e.g. 'LP-1'
  title           text not null,
  body            text,                                -- description / brief
  owner_entity    crm.owner_entity_t not null default 'hearst',
  owner_person    text,                                -- internal owner name (free)
  status          crm.init_status_t not null default 'planned',
  priority        crm.init_priority_t not null default 'medium',
  start_date      date,
  due_date        date,
  done_at         timestamptz,
  notes           text,
  ordering        int not null default 0,
  archived        boolean not null default false,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists initiatives_workstream_idx on crm.initiatives (workstream_id);
create index if not exists initiatives_status_idx on crm.initiatives (status);
create index if not exists initiatives_due_idx on crm.initiatives (due_date);

drop trigger if exists initiatives_touch on crm.initiatives;
create trigger initiatives_touch
  before update on crm.initiatives
  for each row execute function crm.touch_updated_at();

-- ---------------------------------------------------------------------
-- LINKS — initiative <-> operator and initiative <-> partner
-- ---------------------------------------------------------------------
create table if not exists crm.initiative_operators (
  initiative_id   uuid not null references crm.initiatives(id) on delete cascade,
  operator_id     uuid not null references crm.operators(id)   on delete cascade,
  primary key (initiative_id, operator_id)
);

create table if not exists crm.initiative_partners (
  initiative_id   uuid not null references crm.initiatives(id) on delete cascade,
  partner_id      uuid not null references crm.partners(id)    on delete cascade,
  primary key (initiative_id, partner_id)
);

-- Allow tasks to link to initiative or partner (in addition to operator)
alter table crm.tasks add column if not exists initiative_id uuid references crm.initiatives(id) on delete cascade;
alter table crm.tasks add column if not exists partner_id    uuid references crm.partners(id)    on delete cascade;

create index if not exists tasks_initiative_idx on crm.tasks (initiative_id);
create index if not exists tasks_partner_idx    on crm.tasks (partner_id);

-- Allow events / stakeholders / documents on partners as well
alter table crm.stakeholders add column if not exists partner_id uuid references crm.partners(id) on delete cascade;
alter table crm.events       add column if not exists partner_id uuid references crm.partners(id) on delete cascade;
alter table crm.documents    add column if not exists partner_id uuid references crm.partners(id) on delete cascade;

-- Make operator_id nullable on these (now that partner_id is also valid)
alter table crm.stakeholders alter column operator_id drop not null;
alter table crm.events       alter column operator_id drop not null;
alter table crm.documents    alter column operator_id drop not null;

-- ---------------------------------------------------------------------
-- RLS — service_role only
-- ---------------------------------------------------------------------
alter table crm.workstreams           disable row level security;
alter table crm.partners              disable row level security;
alter table crm.initiatives           disable row level security;
alter table crm.initiative_operators  disable row level security;
alter table crm.initiative_partners   disable row level security;

grant all on all tables    in schema crm to service_role;
grant all on all sequences in schema crm to service_role;
