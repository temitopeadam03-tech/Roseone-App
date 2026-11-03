-- Gistupp durable media + remaining engagement entities.
-- Apply after migrations 202611010001 through 202611030003.
-- This migration creates storage buckets and missing normalized feature tables.
-- It deliberately does not insert sample/demo records.

create extension if not exists pgcrypto;

-- Extend the canonical profile without breaking existing profile clients.
alter table public.roseone_profiles
  add column if not exists banner_url text,
  add column if not exists location text not null default '',
  add column if not exists website text not null default '',
  add column if not exists is_private boolean not null default false,
  add column if not exists updated_at timestamptz not null default now();

-- Video engagement is separate from generic posts so Explore can scale independently.
create table if not exists public.roseone_video_likes (
  video_id uuid not null references public.roseone_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);
create table if not exists public.roseone_video_comments (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.roseone_videos(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  parent_comment_id uuid references public.roseone_video_comments(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists roseone_video_comments_thread_idx
  on public.roseone_video_comments(video_id, created_at);
create table if not exists public.roseone_video_saves (
  video_id uuid not null references public.roseone_videos(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (video_id, user_id)
);

-- Store catalogue items are distinct from general marketplace listings.
create table if not exists public.roseone_store_products (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.roseone_stores(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 2 and 160),
  description text not null default '',
  price numeric(14,2) not null check (price >= 0),
  currency text not null default 'NGN',
  category text not null default 'Other',
  inventory_quantity integer check (inventory_quantity is null or inventory_quantity >= 0),
  media_paths jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active','out_of_stock','archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists roseone_store_products_store_idx
  on public.roseone_store_products(store_id, status, created_at desc);

-- Upload metadata makes media ownership and lifecycle auditable. Actual bytes live in Storage.
create table if not exists public.roseone_media_assets (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  bucket_id text not null,
  object_path text not null,
  media_kind text not null check (media_kind in ('image','video','audio','document')),
  mime_type text not null,
  byte_size bigint not null check (byte_size > 0),
  duration_seconds integer,
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path),
  check (duration_seconds is null or duration_seconds > 0)
);
create index if not exists roseone_media_assets_owner_idx
  on public.roseone_media_assets(owner_id, created_at desc);

alter table public.roseone_video_likes enable row level security;
alter table public.roseone_video_comments enable row level security;
alter table public.roseone_video_saves enable row level security;
alter table public.roseone_store_products enable row level security;
alter table public.roseone_media_assets enable row level security;

-- Public engagement reads follow the visibility of the parent video.
drop policy if exists video_likes_read on public.roseone_video_likes;
create policy video_likes_read on public.roseone_video_likes for select
  using (exists (select 1 from public.roseone_videos v where v.id = video_id and
    (v.visibility = 'public' or v.creator_id = auth.uid() or v.visibility = 'followers')));
drop policy if exists video_likes_owner_write on public.roseone_video_likes;
create policy video_likes_owner_write on public.roseone_video_likes for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists video_comments_read on public.roseone_video_comments;
create policy video_comments_read on public.roseone_video_comments for select
  using (exists (select 1 from public.roseone_videos v where v.id = video_id and
    (v.visibility = 'public' or v.creator_id = auth.uid() or v.visibility = 'followers')));
drop policy if exists video_comments_insert_self on public.roseone_video_comments;
create policy video_comments_insert_self on public.roseone_video_comments for insert
  with check (auth.uid() = author_id and exists (select 1 from public.roseone_videos v
    where v.id = video_id and (v.visibility = 'public' or v.creator_id = auth.uid())));
drop policy if exists video_comments_update_delete_self on public.roseone_video_comments;
create policy video_comments_update_delete_self on public.roseone_video_comments for all
  using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists video_saves_owner on public.roseone_video_saves;
create policy video_saves_owner on public.roseone_video_saves for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists store_products_public_read on public.roseone_store_products;
create policy store_products_public_read on public.roseone_store_products for select
  using (status = 'active' or auth.uid() = owner_id);
drop policy if exists store_products_owner_write on public.roseone_store_products;
create policy store_products_owner_write on public.roseone_store_products for all
  using (auth.uid() = owner_id and exists (select 1 from public.roseone_stores s
    where s.id = store_id and s.owner_id = auth.uid()))
  with check (auth.uid() = owner_id and exists (select 1 from public.roseone_stores s
    where s.id = store_id and s.owner_id = auth.uid()));

drop policy if exists media_assets_owner_only on public.roseone_media_assets;
create policy media_assets_owner_only on public.roseone_media_assets for all
  using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Private buckets: serve through authenticated policies or short-lived signed URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('gistupp-media', 'gistupp-media', false, 524288000,
   array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','audio/webm','audio/mpeg','audio/mp4','application/pdf']),
  ('gistupp-avatars', 'gistupp-avatars', true, 10485760,
   array['image/jpeg','image/png','image/webp']),
  ('gistupp-public', 'gistupp-public', true, 52428800,
   array['image/jpeg','image/png','image/webp','image/gif'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Authenticated users may upload only beneath their own UUID folder.
drop policy if exists gistupp_media_insert_own_folder on storage.objects;
create policy gistupp_media_insert_own_folder on storage.objects for insert to authenticated
  with check (bucket_id = 'gistupp-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gistupp_media_select_own_folder on storage.objects;
create policy gistupp_media_select_own_folder on storage.objects for select to authenticated
  using (bucket_id = 'gistupp-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gistupp_media_update_own_folder on storage.objects;
create policy gistupp_media_update_own_folder on storage.objects for update to authenticated
  using (bucket_id = 'gistupp-media' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'gistupp-media' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gistupp_media_delete_own_folder on storage.objects;
create policy gistupp_media_delete_own_folder on storage.objects for delete to authenticated
  using (bucket_id = 'gistupp-media' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists gistupp_avatars_public_read on storage.objects;
create policy gistupp_avatars_public_read on storage.objects for select
  using (bucket_id in ('gistupp-avatars','gistupp-public'));
drop policy if exists gistupp_avatars_insert_own_folder on storage.objects;
create policy gistupp_avatars_insert_own_folder on storage.objects for insert to authenticated
  with check (bucket_id in ('gistupp-avatars','gistupp-public') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gistupp_avatars_update_own_folder on storage.objects;
create policy gistupp_avatars_update_own_folder on storage.objects for update to authenticated
  using (bucket_id in ('gistupp-avatars','gistupp-public') and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id in ('gistupp-avatars','gistupp-public') and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists gistupp_avatars_delete_own_folder on storage.objects;
create policy gistupp_avatars_delete_own_folder on storage.objects for delete to authenticated
  using (bucket_id in ('gistupp-avatars','gistupp-public') and (storage.foldername(name))[1] = auth.uid()::text);
