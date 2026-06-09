import Link from "next/link";
import { notFound } from "next/navigation";
import { readState } from "../../../lib/photoshoots";

export const dynamic = "force-dynamic";
export const metadata = { robots: "noindex" };

function fontParam(name: string) {
  return name.trim().replace(/\s+/g, "+");
}

const ROLES = ["Primary", "Secondary", "Accent", "Supporting", "Supporting", "Supporting"];

function Section({
  title,
  heading,
  children,
}: {
  title: string;
  heading: string;
  children: React.ReactNode;
}) {
  return (
    <section style={{ marginBottom: "3rem" }}>
      <h2
        style={{
          fontFamily: `'${heading}', serif`,
          fontSize: "1.5rem",
          margin: "0 0 1.25rem",
          paddingBottom: "0.5rem",
          borderBottom: "2px solid #1a1a1a",
          display: "inline-block",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

export default async function BrandDoc({
  params,
}: {
  params: Promise<{ jobId: string }>;
}) {
  const { jobId } = await params;
  const state = await readState(jobId);
  if (!state) notFound();

  if (!state.paid) {
    return (
      <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: "2rem" }}>
        <div style={{ textAlign: "center" }}>
          <p className="text-[var(--color-paper)]/85 mb-4">
            Your brand identity document unlocks with the Full Brand Identity Package ($49).
          </p>
          <Link href="/photoshoot" className="text-[var(--color-gold)] hover:underline">
            ← Back to /photoshoot
          </Link>
        </div>
      </main>
    );
  }

  const heading = state.fontPairing?.heading ?? "Poppins";
  const body = state.fontPairing?.body ?? "Inter";
  const fontsUrl = `https://fonts.googleapis.com/css2?family=${fontParam(heading)}:wght@400;600;700&family=${fontParam(body)}:wght@400;500&display=swap`;
  const palette = state.paletteHex ?? [];

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href={fontsUrl} />
      <main
        style={{
          background: "#faf8f3",
          color: "#1a1a1a",
          minHeight: "100vh",
          padding: "clamp(1.5rem,5vw,4rem)",
        }}
      >
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <header style={{ display: "flex", alignItems: "center", gap: "1.5rem", marginBottom: "2.5rem" }}>
            {state.logoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={state.logoUrl}
                alt={`${state.brand_name} logo`}
                style={{ width: 84, height: 84, objectFit: "contain", borderRadius: 12 }}
              />
            )}
            <div>
              <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 13, letterSpacing: 2, textTransform: "uppercase", color: "#8a7a55", margin: 0 }}>
                Brand Identity
              </p>
              <h1 style={{ fontFamily: `'${heading}', serif`, fontSize: "clamp(2rem,6vw,3.2rem)", margin: "4px 0 0", lineHeight: 1.05 }}>
                {state.brand_name}
              </h1>
            </div>
          </header>

          {state.styleNotes && (
            <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 18, lineHeight: 1.6, maxWidth: 680, marginBottom: "3rem", color: "#3a3a3a" }}>
              {state.styleNotes}
            </p>
          )}

          <Section title="Color Palette" heading={heading}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 16 }}>
              {palette.map((hex, i) => (
                <div key={hex + i}>
                  <div style={{ background: hex, height: 96, borderRadius: 10, border: "1px solid rgba(0,0,0,0.08)" }} />
                  <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 12, margin: "8px 0 0", color: "#6a6a6a" }}>
                    {ROLES[i] ?? "Supporting"}
                  </p>
                  <p style={{ fontFamily: "ui-monospace, monospace", fontSize: 14, fontWeight: 600, margin: "2px 0 0", letterSpacing: 0.5 }}>
                    {hex.toUpperCase()}
                  </p>
                </div>
              ))}
            </div>
          </Section>

          <Section title="Typography" heading={heading}>
            <div style={{ display: "grid", gap: 24 }}>
              <div>
                <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 12, color: "#6a6a6a", margin: 0 }}>Headings · {heading}</p>
                <p style={{ fontFamily: `'${heading}', serif`, fontSize: "clamp(1.8rem,5vw,2.8rem)", margin: "4px 0 0", lineHeight: 1.1 }}>
                  The quick brown fox
                </p>
              </div>
              <div>
                <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 12, color: "#6a6a6a", margin: 0 }}>Body · {body}</p>
                <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 18, margin: "4px 0 0", lineHeight: 1.6, maxWidth: 620 }}>
                  The quick brown fox jumps over the lazy dog. 1234567890. Pack my box with five dozen liquor jugs.
                </p>
              </div>
              {state.fontPairing?.rationale && (
                <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 14, color: "#6a6a6a", fontStyle: "italic", margin: 0 }}>
                  {state.fontPairing.rationale}
                </p>
              )}
            </div>
          </Section>

          {state.voiceNotes && (
            <Section title="Brand Voice" heading={heading}>
              <p style={{ fontFamily: `'${body}', sans-serif`, fontSize: 18, lineHeight: 1.6, maxWidth: 680, color: "#3a3a3a" }}>
                {state.voiceNotes}
              </p>
            </Section>
          )}

          <footer
            style={{
              marginTop: "4rem",
              paddingTop: "1.5rem",
              borderTop: "1px solid rgba(0,0,0,0.1)",
              fontFamily: `'${body}', sans-serif`,
              fontSize: 13,
              color: "#8a8a8a",
              display: "flex",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <span>{state.brand_name} — brand identity</span>
            <span>Made by Chappie Works · chappieworks.com</span>
          </footer>
        </div>
      </main>
    </>
  );
}
