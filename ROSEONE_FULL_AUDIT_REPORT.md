# RoseOne full source audit — 1 November 2026

## Scope and method
Reviewed the supplied `RoseOne_SEO_Update_Verification.zip` source tree, including the React screens, `AppContext`, API client, Express API, storage implementation, auth components, migration SQL, package scripts, and SEO files. This is a static source review. The application was not successfully installed or run in a browser in this environment, so visual/browser behavior and end-to-end behavior remain unverified.

## Critical findings

### 1. Authentication and authorization are unsafe/inconsistent
- Removed the hard-coded login password bypass `RoseOne2026!` from `src/server/storage.ts` in this audit package.
- `getAuthUser()` in `src/server/app.ts` accepts `x-user-id` as identity if no valid session token is present.
- Numerous mutation routes fall back to `userId` supplied in request bodies or headers when no authenticated session is found. This permits identity spoofing unless every route is refactored to require a verified session.
- The current custom session store is in the file-backed storage layer; it is not a robust shared auth system on serverless infrastructure.
- Google OAuth is configured in the frontend with Supabase, but the source does not implement a complete bridge from the Supabase-authenticated identity to the application's custom API session.

Required: use Supabase Auth access tokens, verify them server-side, derive the user ID only from the verified token, and enforce ownership/role checks on every protected route. Do not deploy until completed.

### 2. Persistent data is not connected end-to-end
- `src/server/storage.ts` is the active storage layer and writes JSON data.
- `src/context/AppContext.tsx` also reads and writes many entities directly to browser `localStorage` (users, posts, comments, stories, conversations, communities, products, listings, notifications, settings).
- A Supabase migration exists, but the reviewed application storage and API routes do not use Supabase as their primary repository.
- Netlify function `/tmp` and browser localStorage do not provide shared, durable cross-device application data.

Required: migrate data operations to Supabase/Postgres with row-level security, remove client-side authority over shared records, and use durable object storage for media.

### 3. Upload and media architecture is not production-ready
- Express accepts JSON bodies up to 30 MB and writes uploads to `/tmp` in serverless mode.
- This is not a durable upload pipeline and is unsuitable for large video files.
- Explore identifies videos inside ordinary post media and its create action opens the regular post composer.
- The 30-minute maximum is described in the UI but is not enforced by a verified upload pipeline, server-side metadata inspection, or transcoding workflow.

Required: signed direct-to-storage uploads, MIME/content validation, file-size and duration enforcement, thumbnail generation, transcoding, playback delivery, cleanup and access policies.

### 4. Explore controls are partly decorative or misleading
- Explore comments action only displays an informational toast instead of opening the comments interface.
- Share action copies `/post/:id`, but the reviewed `App.tsx` does not establish a dedicated public post route.
- Auto-play-next is stored in device localStorage only, not account settings.
- Video create flow is the generic post composer, not a dedicated video upload flow.

### 5. Audio player can play synthetic audio instead of the user's voice
- `src/components/ui/AudioPlayer.tsx` generates a synthetic melody when the media source is missing or uses a placeholder value such as `audio_voicenote`.
- This can make a missing voice note appear to play successfully even though the user's actual recording is unavailable.

Required: never fabricate a voice recording. Show a clear unavailable/error state when the media URL is missing or inaccessible.

### 6. Community creation uses image URL fields
- `CreateCommunityWizard.tsx` asks for pasted image and banner URLs, rather than providing the image upload flow requested for the product.

### 7. Moderation/admin authorization needs a full review
- Moderation endpoints exist, but the route structure does not demonstrate a complete server-enforced admin-role gate. Admin operations must be protected by verified role claims/database authorization, not UI visibility.

### 8. SEO is only a foundation
- Static homepage metadata, robots, sitemap and structured data exist.
- The app is still a client-rendered SPA and the source does not implement dedicated server-rendered/prerendered public routes for profiles, posts, stores, products or videos.
- Current sitemap is a small static file, not generated from actual public content.

## Additional product gaps identified
- Feed needs server-side pagination, privacy-aware ranking and reliable refresh from persistent records.
- Story views/reactions/replies/expiry need durable records and audience/privacy enforcement.
- Comments need fully connected nested replies, reactions, deletion permissions and moderation.
- Messaging needs verified participant authorization, persistent unread/read/delivery state, media storage and realtime delivery.
- Market/Stores UI exists in part, but complete durable store ownership, seller workflows, product-store relationships, search and access control are not complete.
- Search needs server-side indexed search and privacy filtering across people, posts, videos, communities, stores and listings.
- Notifications need durable generation, delivery and preference enforcement.
- Settings currently combine local cache and API persistence; account-level synchronization is not reliable until the backend migration is completed.
- Account deletion, data export, consent handling, abuse prevention, rate limiting, upload quotas, audit logs and backup/restore procedures need implementation before a public launch.

## Changes made in this audit package
- Removed the fixed password bypass from `src/server/storage.ts`.
- No demo users, posts, videos, products or stores were added.

## Verification status
- Static source inspection: completed for the files listed above.
- Dependency installation: attempted with `npm install --no-audit --no-fund`; command timed out.
- TypeScript check: not run successfully.
- Production build: not run successfully.
- Browser/device testing: not performed.
- Netlify deployment: not performed.

## Release recommendation
Do not deploy this audit package as a production release. The password bypass removal is a security improvement, but authentication/authorization, persistent data migration, durable media, and functional UI gaps remain. The next engineering milestone should be a secure Supabase Auth + server-verified API + Postgres repository foundation, then migrate one feature at a time and test with two independent accounts.
