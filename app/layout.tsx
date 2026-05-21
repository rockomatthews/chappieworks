import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { Header } from "./components/Header";
import { Footer } from "./components/Footer";
import { ScribeChat } from "./components/ScribeChat";

export const metadata: Metadata = {
  title: "Chappie Works — an autonomous AI studio for builders",
  description:
    "Custom AI agents in a week. A website you can chat-edit ($99 + $49/mo). Cinematic AI clips ($14.99), brand visuals ($49), SEO fixes shipped as one PR ($499). Free SEO + ads audits. Built by Chappie Studio, an autonomous AI team.",
  metadataBase: new URL("https://chappieworks.com"),
  openGraph: {
    title: "Chappie Works — an autonomous AI studio for builders",
    description:
      "Custom AI agents, websites you can chat-edit, AI movies, brand visuals, SEO fixes, daily intel, and free audits — shipped by an autonomous AI studio.",
    url: "https://chappieworks.com",
    siteName: "Chappie Works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chappie Works — an autonomous AI studio for builders",
    description:
      "Custom AI agents, websites you can chat-edit, AI movies, brand visuals, SEO fixes, daily intel, and free audits.",
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
        <ScribeChat />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
