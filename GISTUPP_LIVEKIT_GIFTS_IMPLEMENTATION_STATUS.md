# Gistupp LiveKit, Smart Gifts and Live Room Update

## Included in this code update
- Added `livekit-client` and `livekit-server-sdk` dependencies.
- Added authenticated server endpoints to create LiveKit live rooms, mint host/viewer-scoped room tokens, join/leave rooms, end broadcasts, list public live sessions, and persist live chat messages.
- Host token grants publishing and subscribing; viewer token grants subscribe-only permissions.
- Frontend Live Studio now creates a LiveKit room, publishes camera/microphone tracks, tracks connected participants, and supports ending the broadcast.
- Live discovery refreshes active public sessions and allows a signed-in member to join a room, view its video, chat, and send a funded gift.
- Live chat messages are persisted through the API and broadcast to connected room participants through LiveKit reliable data packets.
- Comment appearance settings are saved to Supabase per account.
- Added nine original Gistupp gift artworks (custom metallic/3D-style SVG assets): Gist Coin, Blue Diamond, Silver Crest, Gold Reserve, Orbit Rocket, Velocity Car, Swift Bicycle, Ocean Yacht and Aurora Crown.
- Added a server-side wallet, coin ledger, creator earnings ledger, gift catalogue and atomic gift-send RPC. The RPC checks live-session status and balance, prevents self-gifting, deducts coins, writes the gift and earnings record in one database transaction.
- Coin prices are internal Gistupp coin values, not naira or payment amounts. Coin top-ups are intentionally not enabled until the owner chooses a payment provider and supplies the checkout integration.

## Required configuration
Set these server-side Netlify environment variables:
- `SUPABASE_URL`
- `SUPABASE_SECRET_KEY` (server-only; never expose it as a VITE variable)
- `LIVEKIT_URL` (for example, the LiveKit Cloud websocket URL)
- `LIVEKIT_API_KEY`
- `LIVEKIT_API_SECRET`

The browser also needs the existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` values. The LiveKit API secret must never be exposed to the browser.

## Required database action
Apply `supabase/migrations/202611030005_gistupp_live_wallet_gifts.sql` after the existing LiveKit migration. It creates the wallet, ledger, gift catalogue, creator earnings and persistent chat preference tables, and the atomic gift transaction function. Existing migration files are retained.

## Important limitations / not yet complete
- This source code is integrated with LiveKit SDK APIs, but no LiveKit account/credentials are available in this workspace. A real multi-device room test cannot be claimed until the environment variables are configured and two signed-in accounts test together.
- Guest/co-host invitation workflows, moderator UI/actions, stream recording/replay storage, payment checkout/top-ups, creator cash-out/payouts and fraud/chargeback handling remain future work.
- LiveKit media is real-time when configured; chat persistence is via API and immediate room delivery uses LiveKit data packets. The host-side full chat moderation dashboard is not complete.
- Viewer presence records are stored and updated on join/leave. A production-grade heartbeat/reaper is still needed to clear stale presence after abrupt browser/network loss.
- Gift artwork is original vector illustration with metallic gradients and dimensional highlights, not photographic product renders.
- No successful dependency installation, TypeScript check, production build or browser end-to-end test was possible in this environment. Do not deploy this package as verified production-ready until those checks pass.
