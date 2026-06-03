/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@sparticuz/chromium", "puppeteer-core"],
  outputFileTracingIncludes: {
    "/api/seo-audit/run": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/ads-audit/run": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    // Ship the daily standup markdown into the serverless bundle so
    // /studio/queue can read studio-standups/*.md at runtime (ISR).
    "/studio/queue": ["./studio-standups/**/*"],
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "cdn.fourthwall.com",
      },
    ],
  },
};

export default nextConfig;
