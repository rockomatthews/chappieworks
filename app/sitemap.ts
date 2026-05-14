import type { MetadataRoute } from "next";

const BASE = "https://chappieworks.com";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();
  const pages: { path: string; priority: number; changeFreq: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
    { path: "/", priority: 1.0, changeFreq: "weekly" },
    { path: "/agents", priority: 0.9, changeFreq: "weekly" },
    { path: "/brief/ai-agency", priority: 0.9, changeFreq: "daily" },
    { path: "/seo-audit", priority: 0.8, changeFreq: "weekly" },
    { path: "/seo-audit/sample/chappiethebot", priority: 0.7, changeFreq: "monthly" },
    { path: "/ads-audit", priority: 0.8, changeFreq: "weekly" },
    { path: "/studio", priority: 0.5, changeFreq: "monthly" },
    { path: "/privacy", priority: 0.2, changeFreq: "yearly" },
    { path: "/terms", priority: 0.2, changeFreq: "yearly" },
  ];

  return pages.map((p) => ({
    url: `${BASE}${p.path}`,
    lastModified,
    changeFrequency: p.changeFreq,
    priority: p.priority,
  }));
}
