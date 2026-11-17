import type { MetadataRoute } from "next";
import { getRooms } from "@/lib/cmsContent";
import { getAllPosts } from "@/lib/posts";

const base = "https://jaderiverresort.defoy.in";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "",
    "/rooms",
    "/experiences",
    "/gallery",
    "/location",
    "/contact",
    "/policies",
    "/faq",
    "/post",
    "/reviews",
  ].map((path) => ({
    url: `${base}${path}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: path === "" ? 1 : 0.8,
  }));

  const [rooms, posts] = await Promise.all([getRooms(), getAllPosts()]);

  const roomRoutes = rooms.map((room) => ({
    url: `${base}/rooms/${room.slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.9,
  }));

  const postRoutes = posts.map((post) => ({
    url: `${base}/post/${post.slug}`,
    lastModified: new Date(post.publishedAt),
    changeFrequency: "yearly" as const,
    priority: 0.6,
  }));

  return [...staticRoutes, ...roomRoutes, ...postRoutes];
}
