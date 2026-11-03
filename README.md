# Gistupp — Everything, Connected

Gistupp is a responsive React + TypeScript + Vite social application with a Netlify Functions API. New installs start with empty feeds, stories, messages, communities, and marketplace listings. Visitors must create an account or sign in; no showcase member accounts are shipped.

## Requirements

- Node.js 22.12+ (recommended for the current Vite toolchain)
- npm 10+

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

The development server starts through `tsx server.ts` and serves the Vite app plus the Express API.

## Production build

```bash
npm run build
npm run preview
```

Run `npm run lint` to run TypeScript's no-emit check.

## Deploy the frontend and API to Netlify

1. Push the project to a Git repository.
2. In Netlify, import that repository.
3. Use `npm run build` as the build command and `dist` as the publish directory. `netlify.toml` already defines these values and the API/SPA redirects.
4. Set any required environment variables in Netlify's site settings. Keep private keys server-side; never put secrets in variables prefixed with `VITE_`.
5. Add the custom domain in Netlify and complete the DNS instructions shown by Netlify.
6. Test `/api/health`, registration/login, uploads, and the main social flows on the deployed site.

## Production readiness note — persistence must be configured before public launch

The current server storage implementation writes a JSON database file. On Netlify Functions, the code currently selects `/tmp`, which is ephemeral and is not a durable shared database. Uploaded files written to `/tmp` are also temporary. Therefore, the Netlify build configuration is present, but **multi-user production persistence is not complete** until the storage layer and uploads are connected to durable managed services (for example, a hosted database and object storage). Do not treat the current file-backed store as production-grade persistence.

## Story viewer crash fix

The Story viewer previously returned early before calling its `useEffect` hooks. That changed the hook order when opening or closing a story and could trigger React's error boundary. The viewer now calls hooks consistently, safely handles missing/stale story indexes, and only marks a story viewed when a valid story is active.


## Gistupp branding and PWA

The product display name is now Gistupp. See `GISTUPP_REBRAND_PWA_STATUS.md` for the install flow, service worker behavior, deployment notes, and outstanding verification.


## Gistupp LiveKit and Smart Gifts

The Live Studio now integrates LiveKit room creation, scoped host/viewer tokens, public live discovery, room join/leave, camera/microphone publishing, persisted live chat and account-level chat appearance. Smart Gifts use original Gistupp vector artwork and a server-side wallet ledger/atomic gift RPC.

Before enabling broadcasts, configure server-side `SUPABASE_URL`, `SUPABASE_SECRET_KEY`, `LIVEKIT_URL`, `LIVEKIT_API_KEY`, and `LIVEKIT_API_SECRET` in Netlify. Never expose `SUPABASE_SECRET_KEY` or `LIVEKIT_API_SECRET` through any `VITE_` variable. Apply `supabase/migrations/202611030005_gistupp_live_wallet_gifts.sql` after the previous Live migration. Coin top-ups remain disabled until a payment provider is selected and integrated. See `GISTUPP_LIVEKIT_GIFTS_IMPLEMENTATION_STATUS.md` for scope and remaining work.
