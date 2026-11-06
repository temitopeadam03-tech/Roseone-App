# GistUpp persistence and splash branding update

## Root cause found
The existing `PersistentStorage` stored almost all application data in `.data/roseone-db.json` (or `/tmp` on serverless hosts). Render's ordinary filesystem is ephemeral unless a persistent disk is explicitly mounted. Only Stories and Marketplace listings had a separate shared Supabase payload integration. Posts, comments, likes, conversations, messages, notifications, settings, communities and other state therefore remained local to a running service instance and could disappear on restart/redeploy or differ between instances/devices.

## Changes in this update
- Added a server-only Supabase-backed `gistupp_app_state` snapshot as the durable shared source for the existing API storage model.
- Hydrates the snapshot before API/auth middleware handles requests.
- Persists every existing `schedulePersist()` change to Supabase, while retaining local JSON as a development fallback/cache.
- API responses now wait for pending durable writes before ending, preventing a successful response from being sent while the change is still only in memory.
- Production/Render now fails closed with a clear server error if `SUPABASE_URL` or `SUPABASE_SECRET_KEY` is missing, rather than silently running on ephemeral local JSON.
- A failed save no longer permanently poisons the write queue; later requests can retry.
- Does not upload legacy password credential hashes or server sessions.
- Adds migration `202611030007_gistupp_durable_app_state.sql`; apply it in the Supabase SQL editor before deploying this ZIP.
- Refreshes the GistUpp symbol and simplifies the splash screen to use the standalone mark.

## Required server environment
Configure these on the Render service (server-side only):
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (or `SUPABASE_PUBLISHABLE_KEY`) for browser token verification

Do not put `SUPABASE_SECRET_KEY` in any `VITE_` variable or frontend file.

## Important limitations
This is a compatibility bridge that makes the current global JSON-shaped API state durable and shared without rewriting every route. It is suitable only as a single-service/single-writer transition. Do not run multiple Render instances or workers against this snapshot: concurrent writes can overwrite each other. It is not a substitute for normalized per-feature tables and transaction-safe concurrent writes at scale. The existing Supabase feature tables remain available for a future normalized migration.

The first successful initialization creates the snapshot from the current local JSON only if the Supabase snapshot row does not exist. If the Render filesystem has already been wiped and no backup exists, previously lost records cannot be reconstructed by code.

## Verification
Run `npm run lint` and `npm run build`. Apply the migration, verify the three environment variable names are present in Render (do not share their values), deploy, then test a post from one device and reload on a second device. Restart the service and verify the post remains.
