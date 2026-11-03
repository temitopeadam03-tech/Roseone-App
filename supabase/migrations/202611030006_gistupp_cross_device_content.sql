-- GistUpp shared cross-device content store for Stories and Marketplace listings.
-- Writes are performed by the server using the Supabase service-role key; clients cannot bypass API authorization.
create table if not exists public.gistupp_shared_content (
  content_type text not null check (content_type in ('story','marketplace_listing')),
  content_id text not null,
  owner_id uuid not null references auth.users(id) on delete cascade,
  payload jsonb not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (content_type, content_id)
);
create index if not exists gistupp_shared_content_type_created_idx
  on public.gistupp_shared_content(content_type, created_at desc);
create index if not exists gistupp_shared_content_expiry_idx
  on public.gistupp_shared_content(expires_at) where expires_at is not null;
alter table public.gistupp_shared_content enable row level security;
-- No anon/authenticated policies by design. The trusted server uses SUPABASE_SECRET_KEY.
