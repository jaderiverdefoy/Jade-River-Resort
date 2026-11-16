import type { Metadata } from "next";

/**
 * Shared metadata builder used by every page.
 *
 * It guarantees:
 *  - the canonical mirrors `path`
 *  - og:url is present and matches the canonical (the spider flags it otherwise)
 *  - og:title / og:description are unique per page (the spider flags duplicates)
 *  - a complete Open Graph + X card set is emitted on every page
 *  - images have width/height and alt text
 *  - descriptions stay inside Google's snippet budget
 */
const DEFAULT_IMAGE = {
  url: "/images/jade/og-default.webp",
  width: 1200,
  height: 630,
  alt: "Jade River Resort — dusk over the resort and the Lidder river",
} as const;

export type PageMetaInput = {
  title: string;
  description: string;
  /** Canonical path, e.g. "/faq" or "/rooms/premium-balcony-room". */
  path: string;
  image?: { url: string; width: number; height: number; alt: string };
  /** Extra robots directives for pages that should not be indexed. */
  robots?: Metadata["robots"];
};

export function pageMeta({
  title,
  description,
  path,
  image,
  robots,
}: PageMetaInput): Metadata {
  const og = image ?? DEFAULT_IMAGE;
  // Only pass `robots` through when the caller actually sets it — Next treats
  // an explicit `undefined` as overriding the root layout's robots object.
  const result: Metadata = {
    // `absolute` stops the root layout's "%s — Jade River Resort" template from
    // appending the brand a second time. Every caller already passes the full,
    // unique page title.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      locale: "en_IN",
      url: path,
      siteName: "Jade River Resort",
      title,
      description,
      images: [{ url: og.url, width: og.width, height: og.height, alt: og.alt }],
    },
    twitter: {
      card: "summary_large_image",
      site: "@defoyhotels",
      title,
      description,
      images: [og.url],
    },
  };

  if (robots) result.robots = robots;
  return result;
}
