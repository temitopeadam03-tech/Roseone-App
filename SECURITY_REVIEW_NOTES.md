# Gistupp security integration notes (2026-11-03)

## Changes in this update
- Removed `x-user-id` as an authentication fallback in the Express API.
- Removed body/query user-ID fallbacks for protected actor identity in the API routes touched in `src/server/app.ts`.
- Removed `x-user-id` from the CORS allow-header list.
- Community creation now requires an authenticated API session and derives its creator from that session.

## Important limitation
This is an interim hardening step, not the completed Supabase Auth integration. `getAuthUser` still validates the legacy server-issued session through the JSON-backed storage module. It does not yet verify Supabase JWTs. Registration/login also remain on the legacy storage implementation, and the application still uses file-backed JSON for feature data. Do not deploy this package as a completed production backend.

## Next required work
1. Implement Supabase Auth registration/login and server-side JWT verification using the Supabase project URL and server-only secret key.
2. Replace the JSON storage implementation with Supabase Postgres queries/RPCs for each feature.
3. Replace local filesystem uploads with authenticated Supabase Storage uploads.
4. Add integration tests for two accounts, authorization, privacy, expiry, and cross-device persistence.
5. Run type-check, production build, and browser tests before deployment.

## Supabase bearer-token verification update (2026-11-03)
- Added server middleware that validates Authorization Bearer tokens by calling the configured Supabase Auth `/auth/v1/user` endpoint.
- Supabase-authenticated requests receive an identity derived from the verified Auth response; browser-supplied `x-user-id` and request-body IDs are not used as identity.
- Legacy opaque `rose_` server-issued sessions remain temporarily supported to avoid abruptly locking out existing local accounts. This is transitional only; JSON-backed sessions are not durable on serverless deployments.
- This change does not yet migrate registration/login, profile persistence, bootstrap data, or feature CRUD to Postgres. Those remain required before production use.
- Verification is not yet build-tested in this environment because dependencies are not installed; validate with `npm install`, `npm run lint`, and `npm run build` before deployment.
