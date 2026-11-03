# Gistupp local setup and fixes

## Supabase local configuration

The Supabase project URL for this Gistupp project is:

`https://pqmoramemqsibwfwdhna.supabase.co`

Copy `.env.example` to `.env` and set `VITE_SUPABASE_PUBLISHABLE_KEY` to the project's publishable/anon key from Supabase Project Settings → API. Do not use the `SUPABASE_SECRET_KEY` in any `VITE_` variable and do not share it in chat.

After changing `.env`, stop the dev server with Ctrl+C and restart with `npm run dev`.

## Google OAuth

In Supabase Authentication → URL Configuration, add the local callback/redirect origin `http://localhost:3000` and the production origin `https://gistupp.online` to the allowed redirect URLs. In Authentication → Providers → Google, enable Google and configure the OAuth client ID and secret. Google Cloud's authorized redirect URI must be the Supabase callback URL shown in the Supabase Google provider settings.

## Community/group image uploads

The Create Community and Create Group wizard now accepts actual image files for avatar and cover rather than pasted image URLs. It uploads to the `gistupp-public` Supabase Storage bucket. Apply the durable media migration that creates this bucket and its authenticated owner policies before testing uploads. Uploads require a signed-in Supabase session/JWT and the publishable key.

## Domain

Canonical metadata, sitemap and robots sitemap reference `https://gistupp.online`. The live domain must also be added to Supabase Auth allowed redirect URLs and configured at the domain registrar/hosting provider before production OAuth can work there.
