# RoseOne pre-launch checklist

## Completed in this cleanup
- Removed built-in Clara, Mateo, Sophia, and RoseOne showcase accounts from new installs.
- Removed seeded posts, comments, stories, demo conversation, and official sample community from backend initialization.
- Added migration cleanup for legacy seeded records in the local JSON database and browser storage while preserving member-created content.
- Removed quick-access demo login buttons and stock avatar/banner defaults for newly registered profiles.
- New visitors are prompted to sign in or create an account.
- Aligned the declared esbuild version with Vite 8's peer dependency range.
- Removed the bundled test upload from `public/uploads`.

## Required before a public launch
- Configure durable shared database storage. The current server storage uses a JSON file; Netlify Functions write under `/tmp`, which is ephemeral and not suitable for production persistence.
- Configure durable object/media storage for uploaded photos, videos, and voice notes. Current local/temporary uploads are not durable on serverless hosting.
- Run `npm install`, `npm run build`, and `npm run lint` on the final extracted ZIP.
- Deploy to a staging URL and test registration, login/logout, posts, stories, replies, reactions, messaging, communities, media uploads, privacy settings, and moderation with two separate accounts/devices.
- Configure the production domain, environment variables, rate limiting, monitoring, backups, and privacy/terms pages before inviting the public.

**Do not treat the app as fully production-ready until the durable database and media storage items above are completed and tested.**
