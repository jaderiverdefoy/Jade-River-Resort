# Jade River Resort — SEO fixes (Screaming Frog crawl)

## Input: 24 CSVs → 13 unique issues

md5-deduplicated (24 files, 13 unique reports):

| # | Unique file | Duplicate(s)
|---|-------------|-------------|
| 1 | page_titles_duplicate - Copy.csv | page_titles_duplicate - Copy.csv = page_titles_outside_head.csv = page_titles_outside_head(1).csv |
| 2 | canonicals_missing.csv | canonicals_missing - Copy.csv = canonicals_outside_head.csv |
| 3 | canonicals_canonicalised.csv | canonicals_canonicalised(1).csv |
| 4 | canonicals_nonindexable_canonical.csv | — |
| 5 | meta_description_duplicate.csv | meta_description_outside_head.csv |
| 6 | directives_outside_head.csv | directives_outside_head(1).csv |
| 7 | h1_multiple.csv | h1_duplicate - Copy.csv |
| 8 | h2_missing - Copy - Copy.csv | h2_missing - Copy.csv |
| 9 | images_missing_alt_text.csv | — |
| 10 | images_missing_size_attributes.csv | — |
| 11 | images_over_100_kb.csv | — |
| 12 | response_codes_external_client_error_(4xx).csv | — |
| 13 | security_missing_secure_referrerpolicy_header.csv | security_missing_xframeoptions_header.csv (identical file, same 84 URLs) |

## What was wrong → what was fixed

1. **page_titles_duplicate / outside_head** — `/contact` was a dynamic server
   page, so Next streamed `<title>` into the body and produced one title for
   `/contact` and every `?room=` URL. Fixed: `/contact` is static; `useSearchParams`
   reads the room inside `<BookingForm>` behind `<Suspense>`; query URLs canonicalize
   to `/contact`. *Additionally found & fixed in this pass:* pageMeta titles were
   double-branded ("… — Jade River Resort — Jade River Resort") because the root
   layout's `%s — Jade River Resort` template was applied on top of titles that
   already contained the brand. `pageMeta` now emits `title: { absolute: … }`
   and OG/Twitter titles use the exact title.

2. **canonicals_missing** — `/contact` (+ the 3 `?room=` URLs) now emits
   `<link rel="canonical" href="https://jaderiverresort.defoy.in/contact">`.

3. **canonicals_canonicalised / #4 canonicals_nonindexable_canonical** — every
   canonical pointed at `defoyhotelsandresorts.com/jade-river-resort*` (404).
   Fixed: single source of truth — `metadataBase = https://jaderiverresort.defoy.in`
   and relative canonicals everywhere; sitemap, robots, llms.txt, schema.org
   breadcrumb and JSON-LD all use the same host.

4. **response_codes_external_client_error_(4xx)** — the 14 URLs live on
   `defoyhotelsandresorts.com`, **not** on this codebase. They were discovered
   *only* because the canonical pointed there; with canonicals fixed there is
   no path to them. **Action left on the parent domain:** add
   `301 → https://jaderiverresort.defoy.in/...` for `/jade-river-resort*`.
   Cannot be done from this repo.

5. **meta_description_duplicate / outside_head** — same root causes as #1/#3;
   fixed the same way. Verified: description in `<head>` on every page and
   unique per page (contact query variants canonicalize to `/contact`).

6. **directives_outside_head** — root layout used to render a manual `<head>`
   block, pushing robots/canonical into the body. Removed; metadata is server
   `head` output again. **Additionally found & fixed in this pass:** every page
   using `pageMeta` / `generateMetadata` passed `robots: undefined` explicitly,
   which made Next drop the root `robots`/`googlebot` tags entirely — every
   indexable page was missing `<meta name="robots">`. Fixed: `pageMeta` and the
   post generator only emit `robots`/`keywords` when actually set. Verified:
   all indexable pages now emit
   `robots: index, follow` + `googlebot: index, follow, max-image-preview:large`.

7. **h1_multiple / h1_duplicate** — SignatureIntro renders "Jade River" as an
   aria-hidden decorative div; the page header still owns the single `<h1>`.
   Verified h1=1 on every page (and 0 on /studio, which is noindex).

8. **h2_missing** — `/contact` emitted zero h2. Fixed (visible sr-only h2:
   "Reserve rooms at Jade River Resort, directly"). Also added sr-only h2s to
   the other zero-h2 pages: `/gallery`, `/post`, `/post/[slug]`, `/review`.
   Verified: every public page now has ≥1 h2.

9. **images_missing_alt_text** — every gallery/hero/room/experience image
   already carries an alt; `<img>` without alt = 0 on every page (verified
   served HTML).

10. **images_missing_size_attributes** — all `next/image fill` usages were
    converted to explicit `width`/`height` + `absolute … object-cover`. Verified:
    `<img>` without width/height = 0 on every page.

11. **images_over_100_kb** — crawl reported `w=3840` variants (root cause:
    Next's default `deviceSizes` included 3840). Fixed: `deviceSizes` capped at
    1920, `formats: ["image/avif", "image/webp"]`, and `quality={60}` on the
    remaining heavy heroes (FilmSection aerial, GalleryGrid, GalleryMarquee,
    Experiences). Verified no `w=3840` in served HTML, and previously-flagged
    images at w=1920 AVIF: gallery-09 ≈ 96 KB, gallery-10 ≈ 93 KB,
    exp-family ≈ 91 KB — all under 100 KB.

12. *(see 4 — 4xx)*

13. **security_missing_xframeoptions / referrerpolicy** (same 84 URLs, both
    headers) — `next.config.ts` `headers()` now sends
    `X-Frame-Options: SAMEORIGIN` and
    `Referrer-Policy: strict-origin-when-cross-origin` on every response
    (verified on HTML and static assets).

## Verification (local `next build` + `next start`)

| Page | <title> | canonical | robots | h1 | h2 | imgs w/o alt | imgs w/o dims | w=3840 |
|---|---|---|---|---|---|---|---|---|
| / | ✔ in head | defoy.in | index, follow | 1 | 9 | 0 | 0 | 0 |
| /contact (+ ?room=…) | ✔ | …/contact | ✔ | 1 | 1 | 0 | 0 | 0 |
| /experiences | ✔ | … | ✔ | 1 | 6 | 0 | 0 | 0 |
| /gallery | ✔ | … | ✔ | 1 | 1 | 0 | 0 | 0 |
| /location | ✔ | … | ✔ | 1 | 1 | 0 | 0 | 0 |
| /policies | ✔ | … | ✔ | 1 | 4 | 0 | 0 | 0 |
| /faq | ✔ | … | ✔ | 1 | 11 | 0 | 0 | 0 |
| /post | ✔ | … | ✔ | 1 | 1 | 0 | 0 | 0 |
| /post/why-thirteen-rooms-is-the-point | ✔ | … | ✔ | 1 | 1 | 0 | 0 | 0 |
| /reviews | ✔ | … | ✔ | 1 | 1 | 0 | 0 | 0 |
| /review | ✔ (noindex) | … | noindex | 1 | 1 | 0 | 0 | 0 |
| /rooms* | ✔ | … | ✔ | 1 | ≥2 | 0 | 0 | 0 |

Plus: sitemap.xml lists defoy.in hosts; robots.txt → sitemap + host = defoy.in;
`X-Frame-Options` / `Referrer-Policy` on HTML and JS/CSS; title/OG/twitter
unique per page; OG URL == canonical.

## IMPORTANT
These are code-level fixes. The crawl only clears after a rebuild + deploy to
`jaderiverresort.defoy.in`. Re-run Screaming Frog on the deployed site and
mark this list complete. On the parent domain, add 301 redirects from
`defoyhotelsandresorts.com/jade-river-resort*` (owner's side, not this repo).
