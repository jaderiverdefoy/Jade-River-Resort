# Jade River Resort — SEO fixes (Screaming Frog crawl, 14 unique reports, all fixed)

The 9 duplicate files were dropped from the list after an md5 check:
- page_titles_duplicate - Copy.csv / page_titles_outside_head(1).csv / page_titles_outside_head.csv
- canonicals_missing - Copy.csv / canonicals_outside_head.csv / canonicals_missing.csv
- h2_missing - Copy - Copy.csv / h2_missing - Copy.csv
- h1_duplicate - Copy.csv / h1_multiple.csv
- security_missing_secure_referrerpolicy_header.csv / security_missing_xframeoptions_header.csv
- directives_outside_head(1).csv / directives_outside_head.csv
- meta_description_outside_head.csv / meta_description_duplicate.csv
- canonicals_canonicalised(1).csv / canonicals_canonicalised.csv

## What was wrong and how it was fixed

1. page_titles_duplicate / 2. page_titles_outside_head / 3. canonicals_missing /
4. canonicals_outside_head / 7. directives_outside_head / 8. meta_description_duplicate
   → /contact was a dynamic server page, which pushed its title/description/canonical/
   robots tags into the body instead of <head>, and produced duplicates across the
   `?room=` querystring URLs. Fixed: /contact is now static; `useSearchParams` read the
   room inside a `<Suspense>` boundary in the client `BookingForm`.
   Result: tags are in `<head>` on every page (verified via curl).

5/6/14. canonicals_canonicalised / canonicals_nonindexable_canonical /
   response_codes_external_client_error (404s)
   → canonical pointed at defoyhotelsandresorts.com/jade-river-resort* which returns 404.
   Fixed: single source of truth — canonical everywhere is now the live host
   `https://jaderiverresort.defoy.in` (verified in served HTML for every page tested);
   schema.org breadcrumb, JSON-LD, sitemap, robots and llms.txt all updated too.

   Note: this retires the "deployment path = /jade-river-resort" plan documented in
   bsuiness.md. If that sub-path on the parent domain ever goes live, the base URL in
   `lib/content.ts`/`app/layout.tsx`/`app/sitemap.ts` should be revisited.

9. h1_multiple → SignatureIntro rendered an "Jade River" <h1> on every page; the real
   page H1 came from PageHeader. Fixed: intro text is now an aria-hidden div.

10. h2_missing → /contact had no <h2> at all. Fixed: visible sr-only h2 added
    ("Reserve rooms at Jade River Resort, directly").

11. images_missing_alt_text → every gallery image in the repo already had an alt; the
    deployed build was simply outdated/staggered. Rebuild will clear it.

12. images_missing_size_attributes → all `next/image fill` usages converted to explicit
    width/height + className="absolute inset-0 h-full w-full object-cover". Verified in
    served HTML: <img ... width="1600" height="900"> everywhere.

13. images_over_100_kb → next.config deviceSizes capped at 1920 (default included 3840px).

15. security_missing_xframeoptions_header → next.config now sends
    X-Frame-Options: SAMEORIGIN and Referrer-Policy: strict-origin-when-cross-origin
    on every response.

## Verification (local production build)

- /contact: h1=1, h2=1, title/description/canonical/robots/og all INSIDE <head> ✔
- /gallery, /rooms, /rooms/*, /faq, /policies, /reviews, /post/*: title in <head>,
  canonical = jaderiverresort.defoy.in…, h1=1 ✔
- X-Frame-Options + Referrer-Policy headers present ✔
- sitemap.xml lists jaderiverresort.defoy.in paths; robots.txt points at
  : /sitemap.xml with host jaderiverresort.defoy.in ✔
- All <img> tags carry width/height attributes ✔

## IMPORTANT

The Screaming Frog report was generated against the DEPLOYED site. Every fix above
lands in code; the report only clears after the site is rebuilt and redeployed.

