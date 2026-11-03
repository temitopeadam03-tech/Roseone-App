# Gistupp Live Experience Update

## Included in this update
- Expanded Live landing page with creator toolkit, discovery empty state, stream-health and viewer-insight explanations.
- Expanded Live Studio setup: stream title/category/audience, local camera and microphone permission check, guest requests, chat enable/disable, slow-mode preference, pinned welcome note, and community goal.
- Live chat appearance designer: five background themes, adjustable opacity, and compact/default/large comment text preview.
- Smart Gifts gallery: popular, premium and legendary gift tiers, coin price labels, gift selection and quantity/total preview.
- Gift and chat visual preview to help creators understand the presentation before going live.
- Explicit status messaging prevents the UI from pretending that camera preview is a broadcast or that preview gifts have been charged/delivered.

## Important integration status
This is a frontend experience and interaction-preview update. It does not implement a real LiveKit broadcast, viewer subscriptions, server-authoritative chat, persisted chat appearance, wallet ledger, payment processing, gift delivery, creator payout, guest WebRTC stage, moderation API, or replay storage. The existing `/api/live/token` endpoint must be connected to a deployed LiveKit service before real broadcasting can work. Gift sending must remain disabled as a real transaction until server-side wallet/payment and anti-fraud controls exist.

The Live Studio camera preview uses browser `getUserMedia` and requires HTTPS (or localhost) and user permission. Appearance choices and studio toggles currently remain local UI state and are not persisted to the member profile or room.

## Verification
Source package updated. No successful dependency install, TypeScript check, production build, or end-to-end browser test was available in this environment. Do not treat this package as production-ready until those checks and the real streaming/payment integrations are completed.
