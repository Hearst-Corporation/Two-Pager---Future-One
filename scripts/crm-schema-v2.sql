-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA v2
-- Adds: deck_links, deck_views, tasks
-- =====================================================================

-- ---------------------------------------------------------------------
-- DECK_LINKS  (tokenized deck URLs, one per send)
-- ---------------------------------------------------------------------
create table if not exists crm.deck_links (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid not null references crm.operators(id) on delete cascade,
  token           text not null unique,            -- random 16-char
  pillar          crm.pillar_t not null,
  audience        text not null default 'operator', -- 'operator' | 'misa'
  recipient       text,                            -- e.g. "Equinix"
  recipient_email text,
  notes           text,
  revoked_at      timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists deck_links_operator_idx on crm.deck_links (operator_id);
create unique index if not exists deck_links_token_idx on crm.deck_links (token);

-- ---------------------------------------------------------------------
-- DECK_VIEWS  (one row per slide-view, lightweight analytics)
-- ---------------------------------------------------------------------
create table if not exists crm.deck_views (
  id              uuid primary key default gen_random_uuid(),
  link_id         uuid not null references crm.deck_links(id) on delete cascade,
  operator_id     uuid not null references crm.operators(id) on delete cascade,
  session_id      text not null,                   -- random per browser session
  slide_index     int not null,
  slide_label     text,
  duration_ms     int,                              -- how long they stayed on previous slide
  user_agent      text,
  ip_hash         text,                             -- hashed, not raw
  occurred_at     timestamptz not null default now()
);

create index if not exists deck_views_link_idx on crm.deck_views (link_id);
create index if not exists deck_views_op_idx on crm.deck_views (operator_id);
create index if not exists deck_views_occurred_idx on crm.deck_views (occurred_at desc);

-- ---------------------------------------------------------------------
-- TASKS
-- ---------------------------------------------------------------------
create table if not exists crm.tasks (
  id              uuid primary key default gen_random_uuid(),
  operator_id     uuid references crm.operators(id) on delete cascade,
  title           text not null,
  details         text,
  due_date        date,
  owner           text,
  done            boolean not null default false,
  done_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists tasks_operator_idx on crm.tasks (operator_id);
create index if not exists tasks_due_idx on crm.tasks (due_date) where done = false;
create index if not exists tasks_done_idx on crm.tasks (done);

drop trigger if exists tasks_touch on crm.tasks;
create trigger tasks_touch
  before update on crm.tasks
  for each row execute function crm.touch_updated_at();

-- ---------------------------------------------------------------------
-- RLS — disabled (admin-only schema, service_role access only)
-- ---------------------------------------------------------------------
alter table crm.deck_links disable row level security;
alter table crm.deck_views disable row level security;
alter table crm.tasks      disable row level security;

grant all on all tables in schema crm to service_role;
grant all on all sequences in schema crm to service_role;
