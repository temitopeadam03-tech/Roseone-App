# Gistupp Live implementation status

## Added in this source update
- Added a dedicated Live destination without replacing Home, Explore, Messages, or Market.
- Added mobile bottom-navigation and desktop-sidebar access to Live.
- Added Live Studio setup UI with browser camera/microphone permission checks and local preview.
- Added a database migration for live sessions, viewer presence, live chat, guest invitations, moderators, and gift events.
- Added server-only LiveKit environment variable placeholders to `.env.example`.
- The UI deliberately does not represent a local camera preview as an active broadcast.

## Not yet production-functional
- `/api/live/token` is not implemented yet; Go Live therefore fails closed with a clear message.
- LiveKit room creation, signed access-token issuance, WebRTC publishing/subscribing, realtime room discovery, guest stage, moderation enforcement, gifts/payments, replay recording, stream health and chat subscriptions still require implementation and provider configuration.
- LiveKit requires `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` on the server only. Never expose the secret through a `VITE_` variable.
- The new migration `202611030003_roseone_live_streaming.sql` must be applied in Supabase after migrations `202611030001` and `202611030002`.

## Preservation
The existing Home, Explore, Messages, Market, Profile and other destinations remain in the project. This update adds Live as a separate destination; it does not replace or intentionally remove existing features.
