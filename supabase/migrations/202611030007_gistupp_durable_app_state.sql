-- Durable shared snapshot for the existing GistUpp API storage model.
-- The service-role key is used only by the server; no client policies are added.
create table if not exists public.gistupp_app_state (
  id smallint primary key check (id = 1),
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.gistupp_app_state enable row level security;
-- Intentionally no anon/authenticated policies. Server-side SUPABASE_SECRET_KEY
-- bypasses RLS. Never expose this key to the browser.
