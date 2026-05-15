import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Chappie Works — custom AI agents, with free SEO + ads audits";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_URL = "https://chappieworks.com/chappieWorksEmblemDetailed.png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-start",
          padding: "60px",
          gap: "56px",
          background: "#0b0b0c",
          backgroundImage:
            "radial-gradient(circle at 22% 52%, rgba(201,164,55,0.18) 0%, rgba(201,164,55,0) 55%), radial-gradient(circle at 88% 88%, rgba(139,74,43,0.16) 0%, rgba(139,74,43,0) 55%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#faf7ee",
        }}
      >
        {/* Logo */}
        <div
          style={{
            display: "flex",
            width: "350px",
            height: "494px",
            borderRadius: "36px",
            boxShadow:
              "0 24px 96px rgba(0,0,0,0.75), 0 0 0 1px rgba(201,164,55,0.25)",
            overflow: "hidden",
            flexShrink: 0,
            background: "#1a1a1d",
          }}
        >
          <img
            src={LOGO_URL}
            alt=""
            width={350}
            height={494}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>

        {/* Text */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            justifyContent: "center",
          }}
        >
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontFamily: 'ui-monospace, "SF Mono", Menlo, Monaco, monospace',
              color: "#c9a437",
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              marginBottom: 28,
            }}
          >
            chappieworks · AI agency
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 60,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.02em",
              marginBottom: 28,
            }}
          >
            Custom AI agents. Free audits in 48 hours.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(250,247,238,0.75)",
              lineHeight: 1.4,
            }}
          >
            Agent builds $500–$1,500, shipped in 5–7 days. SEO + ads audits, no card needed.
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
