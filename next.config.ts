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
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // core.sanity-cdn.com serves the Studio bridge script; the
              // Studio also loads auto-updating modules from sanity-cdn.com.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sanity-cdn.com https://*.sanity-cdn.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: blob: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://*.api.sanity.io wss://*.api.sanity.io https://cdn.sanity.io https://sanity-cdn.com https://*.sanity-cdn.com",
              "media-src 'self'",
              "frame-src 'self' https://www.google.com https://www.google.com/maps",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
  images: {
    // Every image on the site is prerendered AVIF ≤ ~94 KB (see
    // scripts/build-jade-images.sh). The on-demand optimizer's JPEG fallback
    // was the only thing still producing >100 KB responses for crawlers that
    // do not advertise AVIF support — so every <Image> serves the file as
    // committed.
    unoptimized: true,
    deviceSizes: [640, 750, 828, 1080, 1200, 1600, 1920],
    qualities: [60, 65, 75],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "img.youtube.com" },
    ],
  },
};

export default nextConfig;
