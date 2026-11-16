import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Missing security headers flagged by the crawl.
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  images: {
    // The default deviceSizes include 3840px, which served enormous assets and
    // blew past the size budget. Cap at 1920 and allow quality 60 for the few
    // hero images that stay above 100 KB AVIF at quality 75.
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    qualities: [60, 65, 75],
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
