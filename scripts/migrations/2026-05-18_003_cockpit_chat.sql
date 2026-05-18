-- Cockpit right-rail chat — persistence schema (per SPEC §6).
--
-- Applied to prod (project ref `zrvlmhuymhyrzonnihce` / future-one) as remote
-- migration `20260518202149_cockpit_chat`. This file is the local-parity copy
-- so the directory matches what is deployed. Re-running is safe (idempotent).
--
-- Read/written by `app/api/cockpit-chat/route.ts` via the persistence adapter
-- `lib/cockpit-chat-persistence.ts`.

create table if not exists public.cockpit_chats (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text default 'Nouvelle conversation',
  created_at timestamptz default now()
);

create table if not exists public.cockpit_messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid references public.cockpit_chats(id) on delete cascade,
  role text not null check (role in ('user','assistant','system')),
  content text not null,
  created_at timestamptz default now()
);

alter table public.cockpit_chats enable row level security;
alter table public.cockpit_messages enable row level security;

drop policy if exists "own chats" on public.cockpit_chats;
create policy "own chats" on public.cockpit_chats
  for all using (auth.uid() = user_id);

drop policy if exists "own messages" on public.cockpit_messages;
create policy "own messages" on public.cockpit_messages
  for all using (
    exists (
      select 1 from public.cockpit_chats c
      where c.id = chat_id and c.user_id = auth.uid()
    )
  );

create index if not exists cockpit_chats_user_created_idx
  on public.cockpit_chats (user_id, created_at desc);

create index if not exists cockpit_messages_chat_created_idx
  on public.cockpit_messages (chat_id, created_at asc);
