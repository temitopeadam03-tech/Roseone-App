# Gistupp Supabase backend implementation status

## Completed in this source package

- The initial foundation migration `202611010001_roseone_shared_data_foundation.sql` creates the first seven tables (profiles, settings, posts, stores, listings, store follows, videos).
- The follow-up migration `202611030001_roseone_social_backend.sql` adds database structures for follows, post likes/reactions/saves/reshares, threaded comments, 2-minute voice comments, stories/views/reactions/comments, direct and group conversations, messages/reactions, notifications, communities/members/channels/posts, reports, admin roles, and private media/avatar storage buckets.
- New tables have RLS enabled and ownership/member policies. The migration adds a Supabase Auth user trigger to create a profile row without inserting demo data.
- The SQL enforces a 120-second maximum for story/post voice comments and a 1,800-second (30-minute) maximum for video metadata in the foundation migration.

- A third migration `202611030002_roseone_rls_hardening.sql` hardens membership and story-audience policies. It prevents users from self-adding to arbitrary private conversations, prevents community joiners from assigning themselves privileged roles, automatically adds the community creator as owner, and applies follower visibility to stories.

## Important: not yet production-connected

The current React application and Express API still contain legacy JSON-file storage paths in `src/server/storage.ts`. The follow-up migration creates the persistent schema, but the current application API has not yet been fully rewritten to read and write every feature through Supabase Postgres and Supabase Storage. Do not treat the application as cross-device production-ready solely because the migrations exist.

The current API also needs a complete Supabase JWT verification and authorization pass. The legacy `x-user-id`/body-user-id fallback must be removed from every protected route before production. The server must never trust a user ID supplied by the browser as proof of identity.

## Required integration work before production

1. Replace custom username/password sessions with Supabase Auth and bridge Supabase user IDs to `roseone_profiles`.
2. Verify every bearer token server-side and derive the actor ID exclusively from the verified token.
3. Move profile, post, comments, stories, messaging, notifications, community, store and listing operations to Supabase queries/RPCs with RLS.
4. Move media uploads to Supabase Storage using authenticated per-user paths; remove `/tmp` and data-URL fallbacks for production media.
5. Add server-side admin-role checks and moderation audit events.
6. Add automated tests for authorization, privacy, expiry, cross-account access, voice duration, video duration, and two-account cross-device persistence.
7. Run dependency installation, type-check, production build and browser tests before deployment.

## Migration order

Apply `202611010001_roseone_shared_data_foundation.sql` first (already applied in the current Supabase project), then `202611030001_roseone_social_backend.sql`, then `202611030002_roseone_rls_hardening.sql`. Review each SQL file and test on a non-production project before production use. The current live app is not yet connected to all of these tables.

## Interim API identity hardening update (2026-11-03)
- Removed the `x-user-id` authentication fallback and removed it from CORS allowed headers.
- Removed request body/query identity fallbacks from actor resolution in the Express API; protected actions now require the server session to resolve an actor.
- Community creation now requires a resolved authenticated actor and overwrites caller-supplied creator identity.
- This remains an interim hardening step: the session resolver is still backed by the legacy JSON storage and is not yet a Supabase JWT verifier. Supabase Auth integration and Postgres/Storage replacement remain unfinished.
- Dependency installation timed out in this environment, so type-check and production build could not be run.
