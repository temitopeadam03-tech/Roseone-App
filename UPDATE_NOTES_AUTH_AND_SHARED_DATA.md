# Gistupp update notes

## Included in this update
- Added a visible “Continue with Google” button to the sign-in screen.
- Added password visibility toggles to sign-in and registration password fields.
- Added a Forgot password panel that requests a Supabase Auth recovery email.
- Added `.env.example` with the frontend Supabase variables.
- Added `@supabase/supabase-js` to `package.json`.

## Required Netlify environment variables
Set these in Netlify Site configuration > Environment variables, then redeploy:
- `VITE_SUPABASE_URL` = your Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` = your Supabase publishable/anon key

Google provider must be enabled in Supabase Auth and the Google OAuth callback must be configured there. In Supabase Auth URL configuration, include the production site URL and `https://YOUR-SITE/reset-password` as an allowed redirect URL. The password-reset UI sends the recovery email; a dedicated `/reset-password` page still needs to be implemented to accept the recovery session and save a new password.

## Important shared-data limitation
This archive's existing backend stores its database JSON under `/tmp` when running on Netlify Functions. `/tmp` is ephemeral and is not a shared durable database across function instances. Therefore posts, users, and Marketplace listings are NOT yet guaranteed to synchronize across devices. That requires moving the app's user/content storage and API reads/writes to a durable shared database (for example, Supabase Postgres) and applying a database schema/migration. The UI changes in this archive alone do not solve that architecture issue.

## Existing-account limitation
The existing Gistupp username/password authentication uses the app's own credential store, while the Google and recovery flows use Supabase Auth. The two identity systems are not yet linked by a verified backend endpoint. Do not consider Google sign-in or password reset production-ready until that integration is completed and tested.
