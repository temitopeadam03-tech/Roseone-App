# Gistupp rebrand and PWA update

## Applied in this source update
- Updated visible product branding from RoseOne to Gistupp across the app UI, splash screen, server-facing labels, page metadata, Open Graph/Twitter metadata, JSON-LD, and web app manifest.
- Updated package name to `gistupp`.
- Added a PWA install control to the global header. It uses the browser's `beforeinstallprompt` event where supported, detects standalone installation, and shows Add to Home Screen guidance on iOS.
- Added a production service worker registration and a minimal service worker with app-shell navigation fallback and same-origin GET caching.
- Kept the existing domain `gistupp.online` in canonical and social URLs because the user has not requested a domain change. Repointing DNS/domain is a separate deployment task.
- Kept the existing icon artwork temporarily. The new simple Gistupp logo/icon has intentionally not been designed in this update, as requested.

## PWA limitations / deployment notes
- Native installation prompts are browser-controlled and appear only when the browser considers the app installable. HTTPS, a valid manifest, and a registered service worker are required.
- iOS Safari does not expose the same native install prompt; the app now explains the Share > Add to Home Screen path.
- The service worker provides a basic shell/navigation fallback and runtime caching. It is not a complete offline social client; authenticated feeds, messages, live streams, uploads, and other server-dependent actions still require connectivity.

## Not represented as complete
- Supabase Auth and Postgres integration across all app entities.
- Durable media storage and media processing.
- Production LiveKit streaming, chat, guests, gifts, moderation and replay.
- End-to-end functional verification of Home, Explore, Messages, Market and all social interactions.
- Production build and browser tests. `npm install --ignore-scripts --no-audit --no-fund` timed out in this environment; `tsc --noEmit` could not run because dependencies/type definitions are unavailable.
