-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA v4
-- Adds: initiative_dependencies (M:N self-link with cycle prevention)
-- =====================================================================

create table if not exists crm.initiative_dependencies (
  initiative_id   uuid not null references crm.initiatives(id) on delete cascade,
  depends_on_id   uuid not null references crm.initiatives(id) on delete cascade,
  notes           text,
  created_at      timestamptz not null default now(),
  primary key (initiative_id, depends_on_id),
  check (initiative_id <> depends_on_id)
);

create index if not exists initiative_deps_init_idx on crm.initiative_dependencies (initiative_id);
create index if not exists initiative_deps_parent_idx on crm.initiative_dependencies (depends_on_id);

alter table crm.initiative_dependencies disable row level security;
grant all on crm.initiative_dependencies to service_role;

-- ---------------------------------------------------------------------
-- Cycle-prevention trigger
-- Refuses any insert that would create a directed cycle
-- ---------------------------------------------------------------------
create or replace function crm.check_initiative_dep_cycle() returns trigger as $$
begin
  if exists (
    with recursive ancestors(id) as (
      select new.depends_on_id
      union
      select d.depends_on_id
      from crm.initiative_dependencies d
      join ancestors a on d.initiative_id = a.id
    )
    select 1 from ancestors where id = new.initiative_id
  ) then
    raise exception 'Cycle detected: % cannot depend on %', new.initiative_id, new.depends_on_id;
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists initiative_deps_cycle on crm.initiative_dependencies;
create trigger initiative_deps_cycle
  before insert on crm.initiative_dependencies
  for each row execute function crm.check_initiative_dep_cycle();
