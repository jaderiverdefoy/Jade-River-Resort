import { cache } from "react";
import {
  experiences as staticExperiences,
  gallery as staticGallery,
  rooms as staticRooms,
  type Experience,
  type GalleryItem,
  type Room,
} from "@/lib/content";
import { getSanityClient } from "@/sanity/lib/client";
import { urlFor } from "@/sanity/lib/image";
import {
  experiencesQuery,
  galleryImagesQuery,
  roomsQuery,
} from "@/sanity/lib/queries";
import type {
  SanityExperience,
  SanityGalleryImage,
  SanityRoom,
} from "@/sanity/lib/types";

/**
 * CMS-backed site content.
 *
 * Every getter is *optional* content: it starts from the built-in data in
 * `lib/content.ts` and adds published Studio documents on top. A room whose
 * slug matches a built-in room replaces it; a new slug is appended. Gallery
 * photographs are appended. That means the Studio can be filled in one room at
 * a time without ever hiding the rest of the site, and local builds work
 * without credentials.
 *
 * Images are requested at a fixed 16:9 crop, 1400 px wide and WebP q55 — the
 * same budget the static photographs were re-encoded to, so the page stays
 * under the image-size limits the SEO crawl checks.
 */

const FALLBACK_ROOM_IMAGE = "/images/jade/gallery-07.avif";

function cdnUrl(image: { asset?: unknown } | null | undefined, width = 1400): string | null {
  if (!image?.asset) return null;
  const builder = urlFor(image as Parameters<typeof urlFor>[0]);
  if (!builder) return null;
  return builder
    .width(width)
    .height(Math.round((width * 9) / 16))
    .fit("crop")
    .quality(55)
    .format("webp")
    .url();
}

function unique(list: string[]): string[] {
  return Array.from(new Set(list));
}

/**
 * Adds CMS items to the built-in list, replacing any item with the same key
 * (a room's slug, an experience's title). That way publishing one room in the
 * Studio never hides the other built-in rooms — the CMS is additive until the
 * editor chooses to override a specific item.
 */
function mergeByKey<T>(base: T[], extra: T[], key: (item: T) => string): T[] {
  const merged = new Map(base.map((item) => [key(item), item]));
  const order = base.map(key);

  for (const item of extra) {
    const id = key(item);
    if (!merged.has(id)) order.push(id);
    merged.set(id, item);
  }

  return order.map((id) => merged.get(id)!);
}

function mapRoom(room: SanityRoom): Room {
  const cover = cdnUrl(room.mainImage) ?? FALLBACK_ROOM_IMAGE;
  const gallery = unique([
    cover,
    ...(room.gallery ?? [])
      .map((image) => cdnUrl(image))
      .filter((url): url is string => Boolean(url)),
  ]);
  const units = room.units ?? 1;

  return {
    slug: room.slug,
    name: room.name,
    short: room.short,
    count: room.countLabel?.trim() || `${units} ${units === 1 ? "room" : "rooms"}`,
    units,
    price: room.price,
    description: room.description,
    long: room.long,
    note: room.note,
    metaDescription: room.metaDescription,
    bestFor: room.bestFor,
    image: cover,
    gallery,
    amenities: room.amenities ?? [],
  };
}

function mapGalleryImage(item: SanityGalleryImage): GalleryItem | null {
  const src = cdnUrl(item.image, 1400);
  if (!src) return null;
  const span =
    item.span === "std" || item.span === "tall" || item.span === "wide"
      ? item.span
      : "wide";
  return {
    src,
    alt: item.image?.alt || "Jade River Resort, Pahalgam",
    span,
  };
}

function mapExperience(item: SanityExperience): Experience | null {
  const image = cdnUrl(item.image);
  if (!image) return null;
  return {
    title: item.title,
    subtitle: item.subtitle,
    body: item.body,
    meta: item.meta,
    image,
  };
}

/**
 * Content is cached for five minutes and tagged, so CMS edits appear even if
 * the Studio webhook is not configured. The webhook still gives instant
 * updates by revalidating the `content` tag.
 */
const fetchOptions = {
  next: { revalidate: 300, tags: ["content"] as string[] },
};

/** Bookable room types, newest Studio order first. */
export const getRooms = cache(async (): Promise<Room[]> => {
  const client = getSanityClient();
  if (!client) return staticRooms;

  try {
    const rows = await client.fetch<SanityRoom[]>(roomsQuery, {}, fetchOptions);
    if (!rows?.length) return staticRooms;
    const mapped = rows
      .filter((row) => row?.slug && row?.name)
      .map(mapRoom);
    return mapped.length ? mergeByKey(staticRooms, mapped, (room) => room.slug) : staticRooms;
  } catch {
    return staticRooms;
  }
});

/** Total number of physical rooms, summed across room types. */
export const getRoomsTotal = cache(async (): Promise<number> => {
  const list = await getRooms();
  const total = list.reduce((sum, room) => sum + (room.units ?? 1), 0);
  return total > 0 ? total : 13;
});

/** Gallery photographs. */
export const getGallery = cache(async (): Promise<GalleryItem[]> => {
  const client = getSanityClient();
  if (!client) return staticGallery;

  try {
    const rows = await client.fetch<SanityGalleryImage[]>(
      galleryImagesQuery,
      {},
      fetchOptions,
    );
    const mapped = (rows ?? [])
      .map(mapGalleryImage)
      .filter((item): item is GalleryItem => item !== null);
    // Gallery photographs are additive: the Studio adds frames to the
    // existing set instead of replacing it.
    return mapped.length ? [...staticGallery, ...mapped] : staticGallery;
  } catch {
    return staticGallery;
  }
});

/** Experiences shown on the homepage and /experiences. */
export const getExperiences = cache(async (): Promise<Experience[]> => {
  const client = getSanityClient();
  if (!client) return staticExperiences;

  try {
    const rows = await client.fetch<SanityExperience[]>(
      experiencesQuery,
      {},
      fetchOptions,
    );
    const mapped = (rows ?? [])
      .map(mapExperience)
      .filter((item): item is Experience => item !== null);
    return mapped.length
      ? mergeByKey(staticExperiences, mapped, (experience) => experience.title)
      : staticExperiences;
  } catch {
    return staticExperiences;
  }
});
