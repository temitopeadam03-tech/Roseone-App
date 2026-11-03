-- RoseOne social backend expansion.
-- Apply after 202611010001_roseone_shared_data_foundation.sql.
-- No demo/sample rows are inserted.

create extension if not exists pgcrypto;

-- Profile/follow graph
create table if not exists public.roseone_follows (
  follower_id uuid not null references auth.users(id) on delete cascade,
  following_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'accepted' check (status in ('pending','accepted')),
  created_at timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists roseone_follows_following_idx on public.roseone_follows(following_id, status);

-- Posts, likes/reactions, saves and reshares
create table if not exists public.roseone_post_likes (
  post_id uuid not null references public.roseone_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null default 'like' check (reaction in ('like','love','fire','rose','clap','insight')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.roseone_post_saves (
  post_id uuid not null references public.roseone_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);
create table if not exists public.roseone_post_reshares (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.roseone_posts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  caption text not null default '',
  created_at timestamptz not null default now(),
  unique (post_id, user_id)
);

-- Threaded comments and voice comments (voice duration capped at 120 seconds)
create table if not exists public.roseone_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.roseone_posts(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.roseone_comments(id) on delete cascade,
  body text not null default '',
  voice_storage_path text,
  voice_duration_seconds integer check (voice_duration_seconds is null or (voice_duration_seconds > 0 and voice_duration_seconds <= 120)),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (char_length(body) > 0 or voice_storage_path is not null)
);
create index if not exists roseone_comments_post_created_idx on public.roseone_comments(post_id, created_at);
create index if not exists roseone_comments_parent_idx on public.roseone_comments(parent_comment_id, created_at);
create table if not exists public.roseone_comment_likes (
  comment_id uuid not null references public.roseone_comments(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (comment_id, user_id)
);

-- Stories, views, reactions and replies
create table if not exists public.roseone_stories (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  media_type text not null check (media_type in ('photo','video','text')),
  media_storage_path text,
  thumbnail_storage_path text,
  text_content text,
  caption text not null default '',
  background text,
  audience text not null default 'everyone' check (audience in ('everyone','followers','close-friends')),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '24 hours'),
  check (media_storage_path is not null or nullif(text_content,'') is not null)
);
create index if not exists roseone_stories_author_expiry_idx on public.roseone_stories(author_id, expires_at desc);
create table if not exists public.roseone_story_views (
  story_id uuid not null references public.roseone_stories(id) on delete cascade,
  viewer_id uuid not null references auth.users(id) on delete cascade,
  viewed_at timestamptz not null default now(),
  primary key (story_id, viewer_id)
);
create table if not exists public.roseone_story_reactions (
  story_id uuid not null references public.roseone_stories(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  emoji text not null,
  created_at timestamptz not null default now(),
  primary key (story_id, user_id)
);
create table if not exists public.roseone_story_comments (
  id uuid primary key default gen_random_uuid(),
  story_id uuid not null references public.roseone_stories(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  voice_storage_path text,
  voice_duration_seconds integer check (voice_duration_seconds is null or (voice_duration_seconds > 0 and voice_duration_seconds <= 120)),
  created_at timestamptz not null default now(),
  check (char_length(body) > 0 or voice_storage_path is not null)
);

-- Direct/group conversations and messages
create table if not exists public.roseone_conversations (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  is_group boolean not null default false,
  created_by uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.roseone_conversation_members (
  conversation_id uuid not null references public.roseone_conversations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','member')),
  joined_at timestamptz not null default now(),
  last_read_at timestamptz,
  primary key (conversation_id, user_id)
);
create index if not exists roseone_conversation_members_user_idx on public.roseone_conversation_members(user_id, joined_at desc);
create table if not exists public.roseone_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.roseone_conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  media_storage_path text,
  media_type text,
  voice_duration_seconds integer check (voice_duration_seconds is null or (voice_duration_seconds > 0 and voice_duration_seconds <= 1800)),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  deleted_at timestamptz,
  check (char_length(body) > 0 or media_storage_path is not null)
);
create index if not exists roseone_messages_conversation_created_idx on public.roseone_messages(conversation_id, created_at desc);
create table if not exists public.roseone_message_reactions (
  message_id uuid not null references public.roseone_messages(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  reaction text not null,
  created_at timestamptz not null default now(),
  primary key (message_id, user_id)
);

-- Notifications are recipient-owned and generated by backend events.
create table if not exists public.roseone_notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  event_type text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists roseone_notifications_recipient_created_idx on public.roseone_notifications(recipient_id, created_at desc);

-- Communities, memberships, channels, posts and moderation
create table if not exists public.roseone_communities (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 3 and 80),
  slug text not null unique,
  description text not null default '',
  category text not null default 'General',
  visibility text not null default 'public' check (visibility in ('public','private','hidden')),
  avatar_storage_path text,
  cover_storage_path text,
  created_at timestamptz not null default now()
);
create table if not exists public.roseone_community_members (
  community_id uuid not null references public.roseone_communities(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('owner','admin','moderator','member')),
  status text not null default 'active' check (status in ('pending','active','banned')),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);
create index if not exists roseone_community_members_user_idx on public.roseone_community_members(user_id, joined_at desc);
create table if not exists public.roseone_community_channels (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.roseone_communities(id) on delete cascade,
  name text not null,
  channel_type text not null default 'posts' check (channel_type in ('posts','announcements','chat')),
  created_at timestamptz not null default now(),
  unique (community_id, name)
);
create table if not exists public.roseone_community_posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.roseone_communities(id) on delete cascade,
  channel_id uuid references public.roseone_community_channels(id) on delete set null,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null default '',
  media jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create table if not exists public.roseone_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('user','post','comment','story','message','listing','community')),
  target_id uuid not null,
  reason text not null,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references auth.users(id) on delete set null
);
create table if not exists public.roseone_admin_roles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('admin','moderator')),
  granted_at timestamptz not null default now()
);

-- Security-definer helpers avoid recursive membership-policy lookups.
create or replace function public.roseone_is_conversation_member(target_conversation uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.roseone_conversation_members m where m.conversation_id = target_conversation and m.user_id = auth.uid()); $$;
create or replace function public.roseone_is_community_member(target_community uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.roseone_community_members m where m.community_id = target_community and m.user_id = auth.uid() and m.status = 'active'); $$;
create or replace function public.roseone_is_community_admin(target_community uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.roseone_community_members m where m.community_id = target_community and m.user_id = auth.uid() and m.role in ('owner','admin','moderator') and m.status = 'active'); $$;
create or replace function public.roseone_is_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.roseone_admin_roles r where r.user_id = auth.uid()); $$;

-- Enable RLS on every new table.
do $$ declare t text; begin
  foreach t in array array[
    'roseone_follows','roseone_post_likes','roseone_post_saves','roseone_post_reshares','roseone_comments','roseone_comment_likes',
    'roseone_stories','roseone_story_views','roseone_story_reactions','roseone_story_comments',
    'roseone_conversations','roseone_conversation_members','roseone_messages','roseone_message_reactions','roseone_notifications',
    'roseone_communities','roseone_community_members','roseone_community_channels','roseone_community_posts','roseone_reports','roseone_admin_roles'
  ] loop execute format('alter table public.%I enable row level security', t); end loop;
end $$;

-- Follow graph
 drop policy if exists follows_read on public.roseone_follows;
 create policy follows_read on public.roseone_follows for select using (true);
 drop policy if exists follows_manage_self on public.roseone_follows;
 create policy follows_manage_self on public.roseone_follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

-- Post interactions inherit post visibility through the parent post.
drop policy if exists post_likes_read on public.roseone_post_likes;
create policy post_likes_read on public.roseone_post_likes for select using (exists (select 1 from public.roseone_posts p where p.id = post_id and (p.visibility = 'public' or p.author_id = auth.uid())));
drop policy if exists post_likes_manage_self on public.roseone_post_likes;
create policy post_likes_manage_self on public.roseone_post_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists post_saves_owner on public.roseone_post_saves;
create policy post_saves_owner on public.roseone_post_saves for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists post_reshares_read on public.roseone_post_reshares;
create policy post_reshares_read on public.roseone_post_reshares for select using (true);
drop policy if exists post_reshares_owner on public.roseone_post_reshares;
create policy post_reshares_owner on public.roseone_post_reshares for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Comments and comment likes
 drop policy if exists comments_read on public.roseone_comments;
 create policy comments_read on public.roseone_comments for select using (exists (select 1 from public.roseone_posts p where p.id = post_id and (p.visibility = 'public' or p.author_id = auth.uid())));
 drop policy if exists comments_insert_self on public.roseone_comments;
 create policy comments_insert_self on public.roseone_comments for insert with check (auth.uid() = author_id and exists (select 1 from public.roseone_posts p where p.id = post_id and (p.visibility = 'public' or p.author_id = auth.uid())));
 drop policy if exists comments_update_delete_self on public.roseone_comments;
 create policy comments_update_delete_self on public.roseone_comments for all using (auth.uid() = author_id) with check (auth.uid() = author_id);
 drop policy if exists comment_likes_read on public.roseone_comment_likes;
 create policy comment_likes_read on public.roseone_comment_likes for select using (true);
 drop policy if exists comment_likes_self on public.roseone_comment_likes;
 create policy comment_likes_self on public.roseone_comment_likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Stories are visible to owner, or to everyone for now; follower/close-friends checks are added in app authorization.
drop policy if exists stories_read on public.roseone_stories;
create policy stories_read on public.roseone_stories for select using (expires_at > now() and (audience = 'everyone' or auth.uid() = author_id));
drop policy if exists stories_owner_write on public.roseone_stories;
create policy stories_owner_write on public.roseone_stories for all using (auth.uid() = author_id) with check (auth.uid() = author_id);
drop policy if exists story_views_read on public.roseone_story_views;
create policy story_views_read on public.roseone_story_views for select using (auth.uid() = viewer_id or exists (select 1 from public.roseone_stories s where s.id = story_id and s.author_id = auth.uid()));
drop policy if exists story_views_self on public.roseone_story_views;
create policy story_views_self on public.roseone_story_views for insert with check (auth.uid() = viewer_id);
drop policy if exists story_reactions_read on public.roseone_story_reactions;
create policy story_reactions_read on public.roseone_story_reactions for select using (true);
drop policy if exists story_reactions_self on public.roseone_story_reactions;
create policy story_reactions_self on public.roseone_story_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists story_comments_read on public.roseone_story_comments;
create policy story_comments_read on public.roseone_story_comments for select using (exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.audience = 'everyone' or s.author_id = auth.uid())));
drop policy if exists story_comments_self on public.roseone_story_comments;
create policy story_comments_self on public.roseone_story_comments for insert with check (auth.uid() = author_id and exists (select 1 from public.roseone_stories s where s.id = story_id and s.expires_at > now() and (s.audience = 'everyone' or s.author_id = auth.uid())));
drop policy if exists story_comments_owner_delete on public.roseone_story_comments;
create policy story_comments_owner_delete on public.roseone_story_comments for delete using (auth.uid() = author_id);

-- Conversations and messages: members only.
drop policy if exists conversations_member_read on public.roseone_conversations;
create policy conversations_member_read on public.roseone_conversations for select using (public.roseone_is_conversation_member(id));
drop policy if exists conversations_create_self on public.roseone_conversations;
create policy conversations_create_self on public.roseone_conversations for insert with check (auth.uid() = created_by);
drop policy if exists conversations_owner_update on public.roseone_conversations;
create policy conversations_owner_update on public.roseone_conversations for update using (auth.uid() = created_by) with check (auth.uid() = created_by);
drop policy if exists conversation_members_read on public.roseone_conversation_members;
create policy conversation_members_read on public.roseone_conversation_members for select using (public.roseone_is_conversation_member(conversation_id));
drop policy if exists conversation_members_insert on public.roseone_conversation_members;
create policy conversation_members_insert on public.roseone_conversation_members for insert with check (auth.uid() = user_id or exists (select 1 from public.roseone_conversations c where c.id = conversation_id and c.created_by = auth.uid()));
drop policy if exists conversation_members_update on public.roseone_conversation_members;
create policy conversation_members_update on public.roseone_conversation_members for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists messages_member_read on public.roseone_messages;
create policy messages_member_read on public.roseone_messages for select using (public.roseone_is_conversation_member(conversation_id));
drop policy if exists messages_member_insert on public.roseone_messages;
create policy messages_member_insert on public.roseone_messages for insert with check (auth.uid() = sender_id and public.roseone_is_conversation_member(conversation_id));
drop policy if exists messages_sender_update on public.roseone_messages;
create policy messages_sender_update on public.roseone_messages for update using (auth.uid() = sender_id and public.roseone_is_conversation_member(conversation_id)) with check (auth.uid() = sender_id and public.roseone_is_conversation_member(conversation_id));
drop policy if exists message_reactions_member_read on public.roseone_message_reactions;
create policy message_reactions_member_read on public.roseone_message_reactions for select using (exists (select 1 from public.roseone_messages m where m.id = message_id and public.roseone_is_conversation_member(m.conversation_id)));
drop policy if exists message_reactions_self on public.roseone_message_reactions;
create policy message_reactions_self on public.roseone_message_reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Notifications and reports are private to their owner.
drop policy if exists notifications_recipient_only on public.roseone_notifications;
create policy notifications_recipient_only on public.roseone_notifications for all using (auth.uid() = recipient_id) with check (auth.uid() = recipient_id);
drop policy if exists reports_reporter_or_admin on public.roseone_reports;
create policy reports_reporter_or_admin on public.roseone_reports for select using (auth.uid() = reporter_id or public.roseone_is_admin());
drop policy if exists reports_insert_self on public.roseone_reports;
create policy reports_insert_self on public.roseone_reports for insert with check (auth.uid() = reporter_id);
drop policy if exists reports_admin_update on public.roseone_reports;
create policy reports_admin_update on public.roseone_reports for update using (public.roseone_is_admin()) with check (public.roseone_is_admin());
drop policy if exists admin_roles_read_self on public.roseone_admin_roles;
create policy admin_roles_read_self on public.roseone_admin_roles for select using (auth.uid() = user_id or public.roseone_is_admin());

-- Communities and channels.
drop policy if exists communities_read on public.roseone_communities;
create policy communities_read on public.roseone_communities for select using (visibility = 'public' or auth.uid() = owner_id or public.roseone_is_community_member(id));
drop policy if exists communities_create_self on public.roseone_communities;
create policy communities_create_self on public.roseone_communities for insert with check (auth.uid() = owner_id);
drop policy if exists communities_owner_update on public.roseone_communities;
create policy communities_owner_update on public.roseone_communities for update using (auth.uid() = owner_id) with check (auth.uid() = owner_id);
drop policy if exists community_members_read on public.roseone_community_members;
create policy community_members_read on public.roseone_community_members for select using (public.roseone_is_community_member(community_id) or exists (select 1 from public.roseone_communities c where c.id = community_id and c.visibility = 'public'));
drop policy if exists community_members_join on public.roseone_community_members;
create policy community_members_join on public.roseone_community_members for insert with check (auth.uid() = user_id);
drop policy if exists community_members_admin_update on public.roseone_community_members;
create policy community_members_admin_update on public.roseone_community_members for update using (public.roseone_is_community_admin(community_id)) with check (public.roseone_is_community_admin(community_id));
drop policy if exists community_channels_read on public.roseone_community_channels;
create policy community_channels_read on public.roseone_community_channels for select using (public.roseone_is_community_member(community_id) or exists (select 1 from public.roseone_communities c where c.id = community_id and c.visibility = 'public'));
drop policy if exists community_channels_admin on public.roseone_community_channels;
create policy community_channels_admin on public.roseone_community_channels for all using (public.roseone_is_community_admin(community_id)) with check (public.roseone_is_community_admin(community_id));
drop policy if exists community_posts_read on public.roseone_community_posts;
create policy community_posts_read on public.roseone_community_posts for select using (public.roseone_is_community_member(community_id) or exists (select 1 from public.roseone_communities c where c.id = community_id and c.visibility = 'public'));
drop policy if exists community_posts_insert on public.roseone_community_posts;
create policy community_posts_insert on public.roseone_community_posts for insert with check (auth.uid() = author_id and public.roseone_is_community_member(community_id));
drop policy if exists community_posts_owner_delete on public.roseone_community_posts;
create policy community_posts_owner_delete on public.roseone_community_posts for delete using (auth.uid() = author_id or public.roseone_is_community_admin(community_id));

-- Auth profile bootstrap: create a profile row when a new Supabase Auth user is registered.
create or replace function public.roseone_handle_new_auth_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.roseone_profiles (id, handle, display_name, bio)
  values (
    new.id,
    case
      when exists (select 1 from public.roseone_profiles p where p.handle = lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(coalesce(new.email,''),'@',1)), '[^a-zA-Z0-9_]', '', 'g')))
      then left(lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(coalesce(new.email,''),'@',1)), '[^a-zA-Z0-9_]', '', 'g')), 18) || '_' || left(replace(new.id::text, '-', ''), 6)
      else nullif(lower(regexp_replace(coalesce(new.raw_user_meta_data->>'handle', split_part(coalesce(new.email,''),'@',1)), '[^a-zA-Z0-9_]', '', 'g')), '')
    end,
    coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''),'@',1)),
    coalesce(new.raw_user_meta_data->>'bio', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists roseone_on_auth_user_created on auth.users;
create trigger roseone_on_auth_user_created after insert on auth.users for each row execute procedure public.roseone_handle_new_auth_user();

-- Storage buckets for user media. Objects remain private by default; public profile/feed images can be served via signed URLs or app-controlled policy later.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('roseone-media','roseone-media',false,52428800,array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/webm','audio/mpeg','audio/mp4','audio/ogg','audio/wav']),
  ('roseone-avatars','roseone-avatars',true,10485760,array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

drop policy if exists roseone_media_owner_read on storage.objects;
create policy roseone_media_owner_read on storage.objects for select using (bucket_id = 'roseone-media' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_media_owner_insert on storage.objects;
create policy roseone_media_owner_insert on storage.objects for insert with check (bucket_id = 'roseone-media' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_media_owner_update on storage.objects;
create policy roseone_media_owner_update on storage.objects for update using (bucket_id = 'roseone-media' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'roseone-media' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_media_owner_delete on storage.objects;
create policy roseone_media_owner_delete on storage.objects for delete using (bucket_id = 'roseone-media' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_avatars_read on storage.objects;
create policy roseone_avatars_read on storage.objects for select using (bucket_id = 'roseone-avatars');
drop policy if exists roseone_avatars_owner_insert on storage.objects;
create policy roseone_avatars_owner_insert on storage.objects for insert with check (bucket_id = 'roseone-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_avatars_owner_update on storage.objects;
create policy roseone_avatars_owner_update on storage.objects for update using (bucket_id = 'roseone-avatars' and auth.uid()::text = (storage.foldername(name))[1]) with check (bucket_id = 'roseone-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
drop policy if exists roseone_avatars_owner_delete on storage.objects;
create policy roseone_avatars_owner_delete on storage.objects for delete using (bucket_id = 'roseone-avatars' and auth.uid()::text = (storage.foldername(name))[1]);
