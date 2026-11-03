# Gistupp durable data migration — implementation status

## What this update adds

- A forward-only Supabase migration for missing normalized Explore/video engagement tables (`roseone_video_likes`, `roseone_video_comments`, `roseone_video_saves`).
- A separate store catalogue table (`roseone_store_products`) with owner/store constraints.
- A media ownership metadata table (`roseone_media_assets`).
- Additional profile fields without changing existing profile identifiers.
- Private media, public avatar and public asset Storage buckets with per-user-folder upload/update/delete policies.
- Indexes and row-level security policies for the new tables.

## Apply order

The migration assumes the existing migrations have already been applied in this order:

1. `202611010001_roseone_shared_data_foundation.sql`
2. `202611030001_roseone_social_backend.sql`
3. `202611030002_roseone_rls_hardening.sql`
4. `202611030003_roseone_live_streaming.sql`
5. `202611030004_durable_media_and_feature_completion.sql` (new)

If your Supabase project already has migrations 1–4 applied, apply only migration 5 in the Supabase SQL Editor. It is written to be repeatable for its own objects. Review the SQL output for errors before proceeding.

## Critical integration status

This is a schema and storage-security expansion, **not yet a completed migration of the running application away from its legacy JSON/localStorage store**. Existing API routes still use `PersistentStorage` for several feature paths. The app must be switched feature-by-feature to the Supabase repository before these new tables become the live source of truth. Do not delete the legacy store or assume cross-device synchronization is complete yet.

The storage buckets are private/public according to their purpose. Private media should be delivered with authenticated reads or short-lived signed URLs; do not store service-role credentials in browser code.

## Required server configuration

- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server-side only; never use a `VITE_` prefix)
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

No credential values belong in this repository or in client-side bundles.

## Validation still required

- Apply migration in Supabase and verify all created tables, policies and buckets.
- Install dependencies and run `npm run lint` and `npm run build`.
- Implement and test server repository integration for profiles, posts, reactions, comments, stories, messaging, stores and marketplace.
- Test with two separate Supabase accounts and two devices/browsers.
- Test signed URLs, private media access, upload size/type limits and ownership enforcement.
