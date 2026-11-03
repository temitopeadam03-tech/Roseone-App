# GistUpp Live completion update

## Changes in this update
- Live discovery now returns public broadcasts to everyone and followers-only broadcasts only to signed-in users who have an accepted follow relationship with the host. The join endpoint continues to enforce the same audience rule, so hiding a card is not the only access control.
- The Go Live flow now cleans up a partially-created LiveKit room/session if publishing fails.
- If LiveKit connection or publishing fails after the preview stream is released, the studio attempts to reacquire the camera and microphone and restore the preview instead of leaving the creator with a dead camera.
- Live Studio branding uses the full GistUpp name in the relevant labels.

## Required server configuration
Configure these as server-side environment variables on the hosting service:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (secret; never use a `VITE_` prefix)
- `LIVEKIT_URL`
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

The browser still uses the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values. Never expose the LiveKit API secret or Supabase secret key to browser code.

## Deployment and verification
1. Confirm the LiveKit migration and wallet/gift migration have been applied to the Supabase project (`202611030003_roseone_live_streaming.sql` and `202611030005_gistupp_live_wallet_gifts.sql`, along with their prerequisites).
2. Merge/copy this source update into the existing repository without replacing `.env`, `.git`, `node_modules`, or hosting secrets.
3. Run `npm install`, `npm run build`, and deploy through the existing hosting workflow.
4. Test with two separate signed-in accounts on different devices: one starts a public live; the other discovers and joins; repeat with followers-only visibility using an accepted follower and a non-follower; verify camera, microphone, comments, viewer counts, leave and end behaviour.

## Known limitations
- No real LiveKit credentials or Supabase project access were available in this workspace, and dependency installation timed out. Therefore this update has not been build-checked or tested against a live multi-device room here.
- Viewer presence can still become stale if a viewer closes a browser or loses network without calling the leave endpoint. A server-side heartbeat/reaper is still required for fully accurate viewer counts at scale.
- Public discovery currently refreshes on the existing polling interval; it is not a push-based realtime feed.
- A successful Go Live flow still depends on valid server credentials, browser camera/microphone permissions, HTTPS, and applied database migrations.
