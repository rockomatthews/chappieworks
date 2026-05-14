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
    { path: "/blog", priority: 0.7, changeFreq: "weekly" },
    { path: "/blog/custom-ai-agent-cost-2026", priority: 0.8, changeFreq: "monthly" },
    { path: "/blog/how-to-brief-an-agent-build", priority: 0.7, changeFreq: "monthly" },
    { path: "/blog/ai-agent-vs-zapier", priority: 0.8, changeFreq: "monthly" },
    { path: "/blog/inbox-triage-build-recipe", priority: 0.7, changeFreq: "monthly" },
    { path: "/blog/running-7-ai-personas-with-paperclip", priority: 0.8, changeFreq: "monthly" },
    { path: "/studio", priority: 0.5, changeFreq: "monthly" },
    { path: "/ads-audit/sample/chappiethebot", priority: 0.7, changeFreq: "monthly" },
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
