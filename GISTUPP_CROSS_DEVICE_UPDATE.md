# GistUpp cross-device content and branding update

This update changes Stories and Marketplace creation to persist through the authenticated server API, stores the shared content payloads in Supabase Postgres, stores uploaded media in Supabase Storage, and refreshes connected clients every 15 seconds (plus when the tab regains focus).

## Required Supabase migration

Before deploying this code, open the Supabase project `pqmoramemqsibwfwdhna`, go to **SQL Editor**, create a new query, paste and run the complete contents of:

`supabase/migrations/202611030006_gistupp_cross_device_content.sql`

The migration creates `public.gistupp_shared_content`. It intentionally has RLS enabled and no direct client policies: only the trusted server, using `SUPABASE_SECRET_KEY`, reads and writes this table.

## Required environment variables

Ensure the Render service and Netlify function environment both contain:

- `SUPABASE_URL=https://pqmoramemqsibwfwdhna.supabase.co`
- `SUPABASE_SECRET_KEY` = the project's server-side secret/service-role key (never expose it in browser variables)
- `VITE_SUPABASE_URL=https://pqmoramemqsibwfwdhna.supabase.co`
- `VITE_SUPABASE_PUBLISHABLE_KEY` = the project's publishable/anon key

Do not put `SUPABASE_SECRET_KEY` in any `VITE_` variable or commit it to Git.

## What changed

- Story creation now calls the authenticated API and stores the created story centrally.
- Marketplace listing creation now calls the authenticated API and stores the listing centrally.
- Bootstrap reads shared Stories and Marketplace listings from Supabase, not only the process-local JSON cache.
- Clients refresh shared content every 15 seconds and when the browser tab regains focus.
- Media uploads use Supabase Storage when server credentials are configured. Image uploads use the public `gistupp-public` bucket; audio/video uploads use private `gistupp-media` signed URLs.
- The app mark is now a GistUpp conversation/orbit monogram. Header, splash, favicon and PWA icon artwork are aligned with the GistUpp brand; the header wordmark is protected from wrapping/clipping.

## Verification note

The earlier deployed commit built successfully, but this new source update must be built and deployed after the SQL migration is applied. Test by signing into the same accounts on two devices, publishing a Story on one and a Marketplace listing on the other, then allow up to 15 seconds for the other device to refresh.
