# Gistupp Supabase Auth integration status

## Implemented in this update
- API middleware verifies Supabase bearer tokens against the project's Auth user endpoint.
- Authenticated identity is derived from the verified Supabase response.
- `x-user-id` and user IDs in request payloads are not treated as authentication proof.
- Transitional support remains for pre-existing opaque `rose_` sessions only.

## Still required
- Move registration and login to Supabase Auth (including username/handle lookup policy).
- Create/update `roseone_profiles` when an Auth user is created and synchronize profile changes.
- Replace JSON bootstrap and feature storage with Postgres queries/RPCs.
- Apply and test all RLS policies with at least two independent test accounts.
- Replace `/tmp` media uploads with private/public Supabase Storage buckets and signed URLs as appropriate.
- Test Google OAuth, password recovery, session refresh, logout, and account deletion.

**Do not treat this interim package as production-ready.**
