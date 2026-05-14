import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Chappie Works — custom AI agents, with free SEO + ads audits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0b0c",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              fontSize: "13px",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
              color: "#c9a84c",
              fontFamily: "monospace",
            }}
          >
            CHAPPIE WORKS
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "58px",
              fontWeight: 700,
              color: "#f0ece4",
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
            }}
          >
            Custom AI agents.
            <br />
            Free in 48 hours.
          </div>
          <div
            style={{
              fontSize: "22px",
              color: "rgba(240,236,228,0.7)",
              lineHeight: 1.5,
              maxWidth: "700px",
            }}
          >
            Agent builds $500–$1,500, shipped in 5–7 days. Free SEO + ads
            audits, no card needed. Built by Chappie Studio.
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: "14px",
              color: "#c9a84c",
              fontFamily: "monospace",
              letterSpacing: "0.05em",
            }}
          >
            chappieworks.com
          </div>
          <div
            style={{
              display: "flex",
              gap: "24px",
              fontSize: "13px",
              color: "rgba(240,236,228,0.4)",
              fontFamily: "monospace",
            }}
          >
            <span>agent builds</span>
            <span>·</span>
            <span>seo audits</span>
            <span>·</span>
            <span>ads audits</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
