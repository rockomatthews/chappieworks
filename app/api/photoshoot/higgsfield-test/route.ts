import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { higgsfieldImage } from "../../../lib/higgsfield";

export const runtime = "nodejs";
export const maxDuration = 150;
export const dynamic = "force-dynamic";

// Pilot A/B harness: force one image through Higgsfield (regardless of the
// IMAGE_BACKEND toggle) and report the image + wall-clock latency, so we can
// judge cost/quality/speed vs fal-Nano-Banana before flipping production.
//
// Off unless HF_TEST_SECRET is set; requires ?secret= to match. Optional
// ?ref=<url> exercises the reference-image (edit) path.
export async function GET(req: Request) {
  const secret = process.env.HF_TEST_SECRET;
  const { searchParams } = new URL(req.url);
  if (!secret || searchParams.get("secret") !== secret) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const prompt =
    searchParams.get("prompt") ??
    "A minimalist product hero shot of a matte black wireless speaker on a warm concrete surface, soft studio light, shallow depth of field. No text, no typography, no lettering.";
  const aspectRatio = searchParams.get("aspect") ?? "3:2";
  const ref = searchParams.get("ref");

  const started = Date.now();
  try {
    const b64 = await higgsfieldImage({
      prompt,
      aspectRatio,
      referenceUrls: ref ? [ref] : undefined,
    });
    const ms = Date.now() - started;
    const buf = Buffer.from(b64, "base64");
    const blob = await put(
      `higgsfield-test/${Date.now()}.png`,
      buf,
      { access: "public", contentType: "image/png", addRandomSuffix: true },
    );
    return NextResponse.json({
      ok: true,
      ms,
      bytes: buf.length,
      url: blob.url,
      mode: ref ? "edit" : "text-to-image",
    });
  } catch (err) {
    return NextResponse.json(
      {
        ok: false,
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : "unknown",
      },
      { status: 502 },
    );
  }
}
