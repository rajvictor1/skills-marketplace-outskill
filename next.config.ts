import type { NextConfig } from "next";

const launchIndexing =
  process.env.VERCEL_ENV === "production" &&
  process.env.SEO_INDEXING_ENABLED === "true" &&
  Boolean(process.env.NEXT_PUBLIC_SITE_URL?.startsWith("https://"));
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://vercel.live" +
    (process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""),
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://vercel.live wss://*.pusher.com",
  "frame-src https://vercel.live",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");
const nextConfig: NextConfig = {
  // Keep established slashless URLs. Next permanently normalizes slash variants.
  trailingSlash: false,
  async redirects() {
    return [
      {
        source: "/for-developers",
        destination: "/docs/publishing",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Content-Security-Policy", value: csp },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          ...(process.env.VERCEL
            ? [{ key: "Strict-Transport-Security", value: "max-age=31536000" }]
            : []),
          ...(!launchIndexing
            ? [{ key: "X-Robots-Tag", value: "noindex, nofollow" }]
            : []),
        ],
      },
      ...[
        "/admin/:path*",
        "/dashboard/:path*",
        "/auth/:path*",
        "/api/:path*",
        "/publish",
        "/search",
      ].map((source) => ({
        source,
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      })),
    ];
  },
};
export default nextConfig;
