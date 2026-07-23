import Link from "next/link";
import { notFound } from "next/navigation";
import { readState } from "../../lib/movies";
import { RenderingPoller } from "./RenderingPoller";
import { UnlockButton } from "./UnlockButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type PageProps = {
  params: Promise<{ jobId: string }>;
  searchParams: Promise<{ paid?: string }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { jobId } = await params;
  const short = jobId.slice(0, 8);
  return {
    title: `Movie ${short} · Chappie Works`,
    description:
      "AI-generated movie. Preview free, unlock the HD download to remove the watermark.",
    robots: { index: false, follow: false },
  };
}

export default async function MovieSharePage({
  params,
  searchParams,
}: PageProps) {
  const { jobId } = await params;
  const { paid: paidQuery } = await searchParams;
  const state = await readState(jobId);
  if (!state) {
    notFound();
  }

  const justPaid = paidQuery === "1";
  // Pay-first: right after checkout the webhook may not have started the render
  // yet, so a just-paid awaiting_payment job is "rendering" from the buyer's
  // point of view — the poller picks up the transition.
  const isRendering =
    state.status === "pending" ||
    state.status === "generating" ||
    state.status === "watermarking" ||
    (state.status === "awaiting_payment" && (justPaid || state.paid));

  const priceLabel = state.durationSec === 10 ? "$24.99" : "$14.99";
  const isExtension = state.mode === "video";

  return (
    <main>
      <section className="px-6 sm:px-10 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <Link
            href="/movie"
            className="text-sm mono text-[var(--color-mute)] hover:text-[var(--color-gold)]"
          >
            ← Make another movie
          </Link>

          <p className="text-xs mono text-[var(--color-gold)] mt-6 uppercase tracking-widest">
            Movie · /m/{jobId.slice(0, 8)}
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight mt-3 mb-6 leading-[1.15]">
            {state.paid
              ? state.status === "ready"
                ? "Unlocked · HD download ready"
                : "Paid · rendering your clip"
              : state.status === "awaiting_payment"
                ? "Your video brief"
                : "Your preview"}
          </h1>

          {state.prompt && (
            <div className="card rounded-xl p-5 mb-6">
              <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                Prompt
              </p>
              <p className="text-sm text-[var(--color-paper)]/90 leading-relaxed">
                {state.prompt}
              </p>
            </div>
          )}

          {isRendering && (
            <RenderingPoller
              jobId={jobId}
              status={
                state.status === "awaiting_payment"
                  ? "pending"
                  : (state.status as "pending" | "generating" | "watermarking")
              }
            />
          )}

          {state.status === "ready" && state.previewUrl && (
            <div className="space-y-6">
              <div className="card rounded-xl p-4 ring-2 ring-[var(--color-gold)] overflow-hidden">
                <video
                  src={
                    state.paid && state.cleanUrl
                      ? state.cleanUrl
                      : state.previewUrl
                  }
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full rounded-md"
                />
                <div className="flex flex-wrap items-baseline justify-between gap-2 mt-4">
                  <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
                    {state.paid ? "Unlocked · 1080p" : "Preview · watermarked"}
                  </p>
                  <p className="text-[10px] mono text-[var(--color-mute)]">
                    /m/{jobId.slice(0, 8)}
                  </p>
                </div>
              </div>

              {state.paid && (state.hdUrl || state.cleanUrl) && (
                <div
                  className="card rounded-xl p-6"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,164,55,0.1), rgba(201,164,55,0.02))",
                    border: "1px solid rgba(201,164,55,0.4)",
                  }}
                >
                  <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                    1080p download
                  </p>
                  <a
                    href={state.hdUrl ?? state.cleanUrl}
                    download={`chappieworks-${jobId.slice(0, 8)}.mp4`}
                    className="inline-block px-6 py-3 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-medium hover:opacity-90 transition"
                  >
                    Download 1080p MP4 →
                  </a>
                  <p className="text-xs mono text-[var(--color-mute)] mt-3">
                    Also emailed to {state.email}. Commercial rights yours.
                  </p>
                </div>
              )}

              {!state.paid && justPaid && (
                <div className="card rounded-xl p-6 ring-1 ring-[var(--color-gold)]/40">
                  <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                    Payment received — confirming with Stripe
                  </p>
                  <p className="text-sm text-[var(--color-paper)]/85">
                    Refresh this page in a few seconds. If it&rsquo;s still
                    watermarked after a minute, email{" "}
                    <a
                      href="mailto:intake@chappieworks.com"
                      className="text-[var(--color-gold)] hover:underline"
                    >
                      intake@chappieworks.com
                    </a>{" "}
                    with this URL and we&rsquo;ll fix it.
                  </p>
                </div>
              )}

              {!state.paid && !justPaid && (
                <div
                  className="card rounded-xl p-6 sm:p-8"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(201,164,55,0.1), rgba(201,164,55,0.02))",
                    border: "1px solid rgba(201,164,55,0.4)",
                  }}
                >
                  <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-2">
                    Like it? Unlock the HD download.
                  </p>
                  <h2 className="text-xl font-semibold mb-2">
                    {isExtension
                      ? `Buy the unwatermarked extension — ${priceLabel}`
                      : `Remove the watermark — ${priceLabel}`}
                  </h2>
                  <p className="text-sm text-[var(--color-paper)]/85 mb-5 leading-relaxed">
                    {isExtension
                      ? "Get the new 10s 1080p MP4 (just the extension, no watermark) in your inbox + on this page. Stack another 10s anytime by uploading this clip again."
                      : "Get the unwatermarked 1080p MP4 in your inbox + on this page. Commercial rights yours."}
                  </p>
                  <UnlockButton jobId={jobId} priceLabel={priceLabel} />
                  <p className="text-xs mono text-[var(--color-mute)] mt-3">
                    Secure checkout via Stripe. Apple Pay / Google Pay
                    supported.
                  </p>
                </div>
              )}
            </div>
          )}

          {state.status === "failed" && (
            <div className="card rounded-xl p-6 ring-1 ring-[var(--color-rust)]/40">
              <p className="text-xs mono text-[var(--color-rust)] uppercase tracking-widest mb-2">
                Render failed
              </p>
              <p className="text-sm text-[var(--color-paper)]/85 mb-4">
                {state.failureReason ??
                  "Something went sideways on Replicate."}
              </p>
              <Link
                href="/movie"
                className="inline-block px-5 py-2.5 rounded-md border border-white/15 hover:border-[var(--color-gold)] hover:text-[var(--color-gold)] transition text-sm"
              >
                Try a different prompt →
              </Link>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

