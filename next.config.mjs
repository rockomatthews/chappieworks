/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  serverExternalPackages: [
    "@sparticuz/chromium",
    "puppeteer-core",
    "ffmpeg-static",
    "fluent-ffmpeg",
  ],
  outputFileTracingIncludes: {
    "/api/seo-audit/run": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    "/api/ads-audit/run": [
      "./node_modules/@sparticuz/chromium/bin/**/*",
    ],
    // ffmpeg binary for the movie pipeline (image normalize, last-frame
    // extraction, watermark burn, HD boost). Without an explicit include the
    // bundler leaves a /ROOT placeholder path and spawn fails ENOENT.
    "/api/movie/generate": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/movie/status/[jobId]": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/movie/checkout/[jobId]": ["./node_modules/ffmpeg-static/ffmpeg"],
    "/api/stripe/webhook": ["./node_modules/ffmpeg-static/ffmpeg"],
    // Ship the daily standup markdown into the serverless bundle so
    // /studio/queue can read studio-standups/*.md at runtime (ISR).
    "/studio/queue": ["./studio-standups/**/*"],
  },
  images: {
    remotePatterns: [
      // Fourthwall has moved product images between hosts before
      // (cdn.fourthwall.com → imgproxy.fourthwall.dev broke /shop) —
      // allow both apex domains wholesale.
      {
        protocol: "https",
        hostname: "**.fourthwall.com",
      },
      {
        protocol: "https",
        hostname: "**.fourthwall.dev",
      },
    ],
  },
};

export default nextConfig;
