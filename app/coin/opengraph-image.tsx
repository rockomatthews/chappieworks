import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "$CHAPPIE — utility token on Base, launching May 23";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const LOGO_URL = "https://chappieworks.com/brand/chappie-logo.png";

export default function CoinOG() {
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
            "radial-gradient(circle at 25% 50%, rgba(201,164,55,0.28) 0%, rgba(201,164,55,0) 60%), radial-gradient(circle at 85% 85%, rgba(139,74,43,0.18) 0%, rgba(139,74,43,0) 55%)",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          color: "#faf7ee",
        }}
      >
        <div
          style={{
            display: "flex",
            width: "470px",
            height: "470px",
            flexShrink: 0,
            alignItems: "center",
            justifyContent: "center",
            filter:
              "drop-shadow(0 24px 64px rgba(0,0,0,0.7)) drop-shadow(0 0 48px rgba(201,164,55,0.25))",
          }}
        >
          <img
            src={LOGO_URL}
            alt=""
            width={470}
            height={470}
            style={{ display: "block", width: "100%", height: "100%" }}
          />
        </div>

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
            $CHAPPIE · Base · Sat May 23
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 64,
              fontWeight: 700,
              lineHeight: 1.02,
              letterSpacing: "-0.02em",
              marginBottom: 28,
            }}
          >
            Pay the AI studio. In its own coin.
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 22,
              color: "rgba(250,247,238,0.78)",
              lineHeight: 1.4,
            }}
          >
            15% off SKUs for holders. 25% off for stakers. Fair launch via Bankr.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
