import { readState, writeState } from "./movies";
import { seedanceSubmit } from "./seedance";

// Kicks off the actual Seedance render for a job that's been paid for.
// Pay-first flow: /api/movie/generate only records the brief (awaiting_payment);
// this runs from the Stripe webhook (or the bypass path) once money is in.
// Idempotent — re-entry sees an existing seedanceTaskId and returns.
export async function startGeneration(jobId: string): Promise<void> {
  const state = await readState(jobId);
  if (!state) {
    console.error("[chappieworks:movie] startGeneration: state missing", jobId);
    return;
  }
  if (state.seedanceTaskId) {
    return; // already started (webhook retry, double click)
  }

  try {
    const sub = await seedanceSubmit({
      prompt: state.prompt,
      duration: state.durationSec ?? 5,
      aspectRatio: "16:9",
      imageUrls: state.startImageUrl ? [state.startImageUrl] : undefined,
    });
    await writeState({
      ...state,
      // This only ever runs post-payment. Force the flag so a stale blob read
      // can't clobber paid back to false (the exact bug from #31/#32).
      paid: true,
      seedanceTaskId: sub.taskId,
      status: "generating",
      generationStartedAt: new Date().toISOString(),
    });
    console.log(
      "[chappieworks:movie] generation started",
      jobId,
      "seedance",
      sub.taskId,
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:movie] startGeneration failed", jobId, message);
    // The buyer has paid — surface a real failure state so the /m page shows
    // it (and support can refund) instead of spinning forever.
    await writeState({
      ...state,
      paid: true,
      status: "failed",
      failureReason:
        "The render couldn't start after payment. You have NOT lost your money — reply to your receipt email and we'll re-run or refund it.",
    });
  }
}
