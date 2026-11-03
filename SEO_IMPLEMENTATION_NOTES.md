# Gistupp SEO implementation notes

## Included in this package
- Improved homepage title and description.
- Canonical homepage URL and Open Graph URL/locale metadata.
- Open Graph and Twitter summary-card metadata, with absolute share-image URLs and image alt text.
- `strict-origin-when-cross-origin` referrer metadata.
- Password-reset route marked `noindex, nofollow` in the initial HTML runtime.
- Organization and WebSite JSON-LD structured data using the official Gistupp domain.
- `public/robots.txt` with a sitemap reference and crawl exclusions for sensitive/private route patterns.
- `public/sitemap.xml` listing the canonical public homepage only. This intentionally does not invent public posts, profiles, stores, products, or videos.

## Important limitations
Gistupp is currently a client-rendered single-page app. These homepage tags are present in the initial HTML, but client-side changes to `document.title` or metadata are not enough for reliable search previews on every deep URL. The current source uses a client-rendered single-page app with tab-based views and no dedicated public URL routes for profiles, posts, stores, products, or videos. Therefore route-specific public-page SEO cannot honestly be completed by adding metadata alone. First implement dedicated public URLs and ensure the content is readable without authentication where intended; then add server rendering or build-time/dynamic prerendering that reads actual persisted records and emits route-specific title, description, canonical URL, Open Graph tags, and structured data. Add URLs to the sitemap only when they correspond to real, public, accessible records. Never expose private profiles, private posts, messages, settings, or authenticated content in a sitemap.

`robots.txt` is a crawler hint, not access control. Private routes and API data must be protected by authentication and authorization regardless of crawler rules.

## Build verification status
A dependency installation was attempted in the working environment but timed out, so a production build and TypeScript check have not been verified. Do not deploy this ZIP on the assumption that it has passed those checks. Retry `npm install --no-audit --no-fund`, then `npm run lint` and `npm run build` in a network-enabled Node.js 22.12+ environment. Fix any reported errors before deployment.

## Before launch
1. Confirm `gistupp.online` points to the intended Netlify production site and HTTPS is active.
2. Verify `https://gistupp.online/robots.txt` and `https://gistupp.online/sitemap.xml` return the files in this package after deployment.
3. Test the homepage with Google Search Console URL Inspection and submit `https://gistupp.online/sitemap.xml`.
4. Add route-specific metadata and a dynamic sitemap only after public content is served from persistent storage and the routes are publicly readable.
5. Validate JSON-LD and social cards after deployment. Indexing and ranking are controlled by search engines and cannot be guaranteed.
