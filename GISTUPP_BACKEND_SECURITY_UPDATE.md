# Gistupp backend security update

## Changes in this update

- State-changing `/api` requests now require a verified Supabase bearer token or a valid legacy server-issued session token. Registration and login remain public entry points.
- Common actor identity fields (`userId`, `authorId`, `senderId`, `sellerId`, `ownerId`, and related fields) are checked against the authenticated account, including nested payload objects.
- Profile updates are restricted to the authenticated account. Server-managed identity, verification, relationship, and count fields are excluded from profile updates.
- Supabase Auth identities are projected into the existing feature store on successful token verification so profile/post operations can resolve the authenticated member.
- Moderation report listing and moderation actions are restricted to IDs explicitly listed in `GISTUPP_ADMIN_USER_IDS`.

## Required deployment setting

Set `GISTUPP_ADMIN_USER_IDS` in Netlify to a comma-separated list of the Supabase Auth UUIDs that should administer moderation. Keep it empty until the intended administrator accounts are confirmed. Do not put the Supabase secret/service-role key in browser variables.

## Important remaining limitations

This is a security-hardening step, not a completed production backend. The existing feature store is still JSON-file-backed and therefore is not durable or shared across Netlify serverless instances. Supabase profile projection currently feeds that legacy store; posts, comments, stories, messaging, marketplace, and notifications have not yet all been migrated to durable Supabase tables/RPCs. Media uploads also still use local temporary storage or a data-URL fallback. Cross-device consistency and full feature integration must not be considered complete until those migrations and multi-account tests pass.

No production build or browser integration test is claimed in this package because project dependencies are not installed in the working environment.
