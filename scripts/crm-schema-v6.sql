-- =====================================================================
-- FUTUR ONE × MISA — CRM SCHEMA v6
-- Multi-user collaboration layer:
--   - profiles (linked to auth.users)
--   - role enum (admin/editor/viewer)
--   - assigned_to on tasks/initiatives/operators/partners
--   - actor_id on events/deck_links
--   - comments (polymorphic on op/partner/init/task)
--   - notifications (per-user)
--   - signup trigger that creates a profile + grants admin to first user
-- =====================================================================

-- ---------------------------------------------------------------------
-- ROLE ENUM
-- ---------------------------------------------------------------------
do $$ begin
  create type crm.role_t as enum ('admin', 'editor', 'viewer');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.comment_parent_t as enum ('operator', 'partner', 'initiative', 'task');
exception when duplicate_object then null; end $$;

do $$ begin
  create type crm.notif_t as enum ('mention', 'assignment', 'comment_reply', 'status_change', 'invite');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------
-- PROFILES — one row per auth.users entry
-- ---------------------------------------------------------------------
create table if not exists crm.profiles (
  id              uuid primary key references auth.users(id) on delete cascade,
  email           text not null,
  full_name       text,
  avatar_url      text,
  role            crm.role_t not null default 'viewer',
  invited_by      uuid references crm.profiles(id) on delete set null,
  invited_at      timestamptz,
  last_seen_at    timestamptz,
  is_active       boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists profiles_role_idx on crm.profiles (role);
create index if not exists profiles_email_idx on crm.profiles (lower(email));

drop trigger if exists profiles_touch on crm.profiles;
create trigger profiles_touch
  before update on crm.profiles
  for each row execute function crm.touch_updated_at();

-- ---------------------------------------------------------------------
-- ASSIGNMENT — add assigned_to / assignee_id to existing tables
-- ---------------------------------------------------------------------
alter table crm.tasks       add column if not exists assigned_to uuid references crm.profiles(id) on delete set null;
alter table crm.initiatives add column if not exists assigned_to uuid references crm.profiles(id) on delete set null;
alter table crm.operators   add column if not exists assignee_id uuid references crm.profiles(id) on delete set null;
alter table crm.partners    add column if not exists assignee_id uuid references crm.profiles(id) on delete set null;

create index if not exists tasks_assigned_idx       on crm.tasks       (assigned_to) where done = false;
create index if not exists initiatives_assigned_idx on crm.initiatives (assigned_to) where archived = false;
create index if not exists operators_assignee_idx   on crm.operators   (assignee_id) where archived = false;
create index if not exists partners_assignee_idx    on crm.partners    (assignee_id) where archived = false;

-- ---------------------------------------------------------------------
-- ACTOR ATTRIBUTION — who did what
-- ---------------------------------------------------------------------
alter table crm.events        add column if not exists actor_id uuid references crm.profiles(id) on delete set null;
alter table crm.activity_log  add column if not exists actor_id uuid references crm.profiles(id) on delete set null;
alter table crm.deck_links    add column if not exists actor_id uuid references crm.profiles(id) on delete set null;
alter table crm.documents     add column if not exists actor_id uuid references crm.profiles(id) on delete set null;

-- ---------------------------------------------------------------------
-- COMMENTS — polymorphic on op/partner/init/task
-- ---------------------------------------------------------------------
create table if not exists crm.comments (
  id              uuid primary key default gen_random_uuid(),
  parent_kind     crm.comment_parent_t not null,
  parent_id       uuid not null,
  parent_thread   uuid references crm.comments(id) on delete cascade,
  author_id       uuid not null references crm.profiles(id) on delete cascade,
  body            text not null,
  mentions        uuid[] not null default '{}',
  edited_at       timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists comments_parent_idx on crm.comments (parent_kind, parent_id, created_at);
create index if not exists comments_author_idx on crm.comments (author_id);
create index if not exists comments_thread_idx on crm.comments (parent_thread);

-- ---------------------------------------------------------------------
-- NOTIFICATIONS — one per (recipient, event)
-- ---------------------------------------------------------------------
create table if not exists crm.notifications (
  id              uuid primary key default gen_random_uuid(),
  recipient_id    uuid not null references crm.profiles(id) on delete cascade,
  actor_id        uuid references crm.profiles(id) on delete set null,
  type            crm.notif_t not null,
  parent_kind     crm.comment_parent_t,
  parent_id       uuid,
  body            text,                                       -- short snippet
  link            text,                                       -- /admin/operator/<id>?focus=comment-<cid>
  read_at         timestamptz,
  created_at      timestamptz not null default now()
);

create index if not exists notifications_recipient_idx on crm.notifications (recipient_id, read_at, created_at desc);

-- ---------------------------------------------------------------------
-- SIGNUP TRIGGER — auto-create profile on auth signup
-- The very first user becomes admin, everyone else defaults to viewer
-- (admins re-grant editor/admin manually via /admin/team).
-- ---------------------------------------------------------------------
create or replace function crm.handle_new_user() returns trigger as $$
declare
  v_count int;
  v_role  crm.role_t;
  v_name  text;
begin
  select count(*) into v_count from crm.profiles;
  v_role := case when v_count = 0 then 'admin'::crm.role_t else 'viewer'::crm.role_t end;
  v_name := coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    split_part(new.email, '@', 1)
  );
  insert into crm.profiles (id, email, full_name, role, avatar_url)
  values (
    new.id,
    new.email,
    v_name,
    v_role,
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end; $$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function crm.handle_new_user();

-- ---------------------------------------------------------------------
-- COMMENT TRIGGERS — fan-out notifications on @mention / replies
-- ---------------------------------------------------------------------
create or replace function crm.notify_on_comment() returns trigger as $$
declare
  m uuid;
  parent_author uuid;
begin
  -- Notify each mentioned profile (excluding self-mentions)
  if array_length(new.mentions, 1) > 0 then
    foreach m in array new.mentions loop
      if m <> new.author_id then
        insert into crm.notifications (recipient_id, actor_id, type, parent_kind, parent_id, body)
        values (m, new.author_id, 'mention', new.parent_kind, new.parent_id,
                left(new.body, 240));
      end if;
    end loop;
  end if;

  -- Notify the original commenter on a thread reply (if not self)
  if new.parent_thread is not null then
    select author_id into parent_author from crm.comments where id = new.parent_thread;
    if parent_author is not null and parent_author <> new.author_id
       and not (new.mentions @> array[parent_author]) then
      insert into crm.notifications (recipient_id, actor_id, type, parent_kind, parent_id, body)
      values (parent_author, new.author_id, 'comment_reply', new.parent_kind, new.parent_id,
              left(new.body, 240));
    end if;
  end if;

  return new;
end; $$ language plpgsql;

drop trigger if exists comments_notify on crm.comments;
create trigger comments_notify
  after insert on crm.comments
  for each row execute function crm.notify_on_comment();

-- ---------------------------------------------------------------------
-- ASSIGNMENT TRIGGERS — notify on (re)assignment of task / initiative
-- ---------------------------------------------------------------------
create or replace function crm.notify_on_task_assign() returns trigger as $$
begin
  if new.assigned_to is not null
     and (tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to) then
    insert into crm.notifications (recipient_id, type, parent_kind, parent_id, body)
    values (new.assigned_to, 'assignment', 'task', new.id,
            'Task assigned: ' || left(new.title, 200));
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists tasks_notify_assign on crm.tasks;
create trigger tasks_notify_assign
  after insert or update of assigned_to on crm.tasks
  for each row execute function crm.notify_on_task_assign();

create or replace function crm.notify_on_initiative_assign() returns trigger as $$
begin
  if new.assigned_to is not null
     and (tg_op = 'INSERT' or new.assigned_to is distinct from old.assigned_to) then
    insert into crm.notifications (recipient_id, type, parent_kind, parent_id, body)
    values (new.assigned_to, 'assignment', 'initiative', new.id,
            'Initiative assigned: ' || coalesce(new.code, '') || ' — ' || left(new.title, 200));
  end if;
  return new;
end; $$ language plpgsql;

drop trigger if exists initiatives_notify_assign on crm.initiatives;
create trigger initiatives_notify_assign
  after insert or update of assigned_to on crm.initiatives
  for each row execute function crm.notify_on_initiative_assign();

-- ---------------------------------------------------------------------
-- RLS — service_role only (admin API uses service_role; future client-direct
-- access will need RLS but we route everything through API for now)
-- ---------------------------------------------------------------------
alter table crm.profiles      disable row level security;
alter table crm.comments      disable row level security;
alter table crm.notifications disable row level security;

grant all on all tables    in schema crm to service_role;
grant all on all sequences in schema crm to service_role;
