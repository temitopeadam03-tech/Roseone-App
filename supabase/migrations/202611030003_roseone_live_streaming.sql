-- RoseOne Live data model. This migration stores live-room metadata and engagement;
-- real-time audio/video media is transported by LiveKit, never by Postgres.
create table if not exists public.roseone_live_sessions (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  room_name text not null unique,
  title text not null check (char_length(title) between 3 and 90),
  category text not null default 'Just Chatting',
  visibility text not null default 'public' check (visibility in ('public','followers')),
  status text not null default 'scheduled' check (status in ('scheduled','live','ended','failed')),
  started_at timestamptz,
  ended_at timestamptz,
  viewer_count integer not null default 0 check (viewer_count >= 0),
  peak_viewers integer not null default 0 check (peak_viewers >= 0),
  replay_path text,
  created_at timestamptz not null default now(),
  constraint live_session_end_after_start check (ended_at is null or started_at is null or ended_at >= started_at)
);
create index if not exists roseone_live_sessions_status_idx on public.roseone_live_sessions(status, started_at desc);
create index if not exists roseone_live_sessions_host_idx on public.roseone_live_sessions(host_id, created_at desc);

create table if not exists public.roseone_live_viewers (
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  primary key (session_id, user_id)
);
create table if not exists public.roseone_live_chat_messages (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 1000),
  is_pinned boolean not null default false,
  deleted_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists roseone_live_chat_session_created_idx on public.roseone_live_chat_messages(session_id, created_at);

create table if not exists public.roseone_live_guests (
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'invited' check (status in ('invited','accepted','declined','removed')),
  invited_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);
create table if not exists public.roseone_live_moderators (
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  assigned_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (session_id, user_id)
);
create table if not exists public.roseone_live_gifts (
  id uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.roseone_live_sessions(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  gift_code text not null,
  quantity integer not null default 1 check (quantity between 1 and 100),
  created_at timestamptz not null default now()
);

alter table public.roseone_live_sessions enable row level security;
alter table public.roseone_live_viewers enable row level security;
alter table public.roseone_live_chat_messages enable row level security;
alter table public.roseone_live_guests enable row level security;
alter table public.roseone_live_moderators enable row level security;
alter table public.roseone_live_gifts enable row level security;

drop policy if exists "live sessions public or host readable" on public.roseone_live_sessions;
create policy "live sessions public or host readable" on public.roseone_live_sessions for select using (
  host_id = auth.uid() or (status = 'live' and visibility = 'public') or
  (status = 'live' and visibility = 'followers' and exists (
    select 1 from public.roseone_profiles p where p.id = host_id and p.handle is not null
  ) and exists (
    select 1 from public.roseone_follows f where f.following_id = host_id and f.follower_id = auth.uid() and f.status = 'accepted'
  ))
);
drop policy if exists "hosts create live sessions" on public.roseone_live_sessions;
create policy "hosts create live sessions" on public.roseone_live_sessions for insert with check (host_id = auth.uid());
drop policy if exists "hosts update live sessions" on public.roseone_live_sessions;
create policy "hosts update live sessions" on public.roseone_live_sessions for update using (host_id = auth.uid()) with check (host_id = auth.uid());

drop policy if exists "live viewers readable by room participants" on public.roseone_live_viewers;
create policy "live viewers readable by room participants" on public.roseone_live_viewers for select using (
  user_id = auth.uid() or exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists "users manage own live viewer presence" on public.roseone_live_viewers;
create policy "users manage own live viewer presence" on public.roseone_live_viewers for all using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "live chat visible to room participants" on public.roseone_live_chat_messages;
create policy "live chat visible to room participants" on public.roseone_live_chat_messages for select using (
  exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.status = 'live' and (s.visibility = 'public' or s.host_id = auth.uid()))
);
drop policy if exists "authenticated viewers send live chat" on public.roseone_live_chat_messages;
create policy "authenticated viewers send live chat" on public.roseone_live_chat_messages for insert with check (sender_id = auth.uid() and exists (
  select 1 from public.roseone_live_sessions s where s.id = session_id and s.status = 'live'
));
drop policy if exists "sender or host moderate live chat" on public.roseone_live_chat_messages;
create policy "sender or host moderate live chat" on public.roseone_live_chat_messages for update using (
  sender_id = auth.uid() or exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
) with check (
  sender_id = auth.uid() or exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);

drop policy if exists "live guests readable by host or guest" on public.roseone_live_guests;
create policy "live guests readable by host or guest" on public.roseone_live_guests for select using (
  user_id = auth.uid() or invited_by = auth.uid() or exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists "hosts invite live guests" on public.roseone_live_guests;
create policy "hosts invite live guests" on public.roseone_live_guests for insert with check (
  invited_by = auth.uid() and exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists "hosts manage live guests" on public.roseone_live_guests;
create policy "hosts manage live guests" on public.roseone_live_guests for update using (
  exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid()) or user_id = auth.uid()
) with check (
  exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid()) or user_id = auth.uid()
);

drop policy if exists "live moderators visible to host and moderator" on public.roseone_live_moderators;
create policy "live moderators visible to host and moderator" on public.roseone_live_moderators for select using (
  user_id = auth.uid() or exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists "hosts assign live moderators" on public.roseone_live_moderators;
create policy "hosts assign live moderators" on public.roseone_live_moderators for insert with check (
  assigned_by = auth.uid() and exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);
drop policy if exists "hosts remove live moderators" on public.roseone_live_moderators;
create policy "hosts remove live moderators" on public.roseone_live_moderators for delete using (
  exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.host_id = auth.uid())
);

drop policy if exists "live gifts visible to room participants" on public.roseone_live_gifts;
create policy "live gifts visible to room participants" on public.roseone_live_gifts for select using (
  exists (select 1 from public.roseone_live_sessions s where s.id = session_id and s.status = 'live' and (s.visibility = 'public' or s.host_id = auth.uid()))
);
drop policy if exists "users send live gifts" on public.roseone_live_gifts;
create policy "users send live gifts" on public.roseone_live_gifts for insert with check (sender_id = auth.uid() and exists (
  select 1 from public.roseone_live_sessions s where s.id = session_id and s.status = 'live'
));
