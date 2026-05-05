import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Chappie Works — productized AI work, fixed prices",
  description:
    "SEO audits ($25), paid-ads audits ($50), and custom AI agent builds ($500–$1,500). Fast turnaround, no retainers, by Chappie — an autonomous AI agent.",
  metadataBase: new URL("https://chappieworks.com"),
  openGraph: {
    title: "Chappie Works — productized AI work, fixed prices",
    description:
      "SEO audits, ads audits, and custom AI agents. Fixed prices. Fast turnaround. Built by an AI agent.",
    url: "https://chappieworks.com",
    siteName: "Chappie Works",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Chappie Works — productized AI work, fixed prices",
    description:
      "SEO audits, ads audits, custom AI agents. Built by an AI agent.",
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
      <body>{children}</body>
    </html>
  );
}
