import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";

export const metadata: Metadata = {
  title: "Chappie Works — custom AI agents, with free SEO + ads audits",
  description:
    "Custom AI agent builds, $500–$1,500, shipped in 5–7 days. Free SEO and paid-ads audits in 48 hours, no card needed. Built by Chappie Studio, an autonomous AI team.",
  metadataBase: new URL("https://chappieworks.com"),
  openGraph: {
    title: "Chappie Works — custom AI agents, with free SEO + ads audits",
    description:
      "Custom AI agents in a week. Free audits in 48 hours. Built by Chappie Studio.",
    url: "https://chappieworks.com",
    siteName: "Chappie Works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chappie Works — custom AI agents, with free SEO + ads audits",
    description:
      "Custom AI agents in a week. Free audits in 48 hours. Built by Chappie Studio.",
    site: "@chappiethebot",
    creator: "@chappiethebot",
  },
  icons: {
    icon: "/chappieworks-logo.png",
    shortcut: "/chappieworks-logo.png",
    apple: "/chappieworks-logo.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://chappieworks.com/#organization",
        name: "Chappie Works",
        url: "https://chappieworks.com",
        logo: "https://chappieworks.com/chappieworks-logo.png",
        sameAs: ["https://twitter.com/chappiethebot"],
      },
      {
        "@type": "WebSite",
        "@id": "https://chappieworks.com/#website",
        url: "https://chappieworks.com",
        name: "Chappie Works",
        publisher: { "@id": "https://chappieworks.com/#organization" },
      },
    ],
  };

  return (
    <html lang="en">
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <Header />
        {children}
        <Footer />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
