import { NextResponse } from "next/server";
import { readState } from "../../../../lib/photoshoots";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ jobId: string }> },
) {
  const { jobId } = await ctx.params;
  const state = await readState(jobId);
  if (!state) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    jobId: state.jobId,
    status: state.status,
    images: state.images,
    failureReason: state.failureReason,
    brand_name: state.brand_name,
    paletteHex: state.paletteHex,
    fontPairing: state.fontPairing,
    paid: state.paid ?? false,
    packageStatus: state.packageStatus ?? "idle",
    packageImages: state.packageImages ?? [],
    packageFailureReason: state.packageFailureReason,
  });
}
