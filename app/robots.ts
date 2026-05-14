import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/brief/thanks"],
      },
    ],
    sitemap: "https://chappieworks.com/sitemap.xml",
    host: "https://chappieworks.com",
  };
}
