import type { Metadata, Viewport } from "next";
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
  return (
    <html lang="en">
      <body>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  );
}
