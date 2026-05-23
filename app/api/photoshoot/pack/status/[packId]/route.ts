import { NextResponse } from "next/server";
import { readPackState } from "../../../../../lib/photoshootPack";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ packId: string }> },
) {
  const { packId } = await ctx.params;
  const state = await readPackState(packId);
  if (!state) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json({
    packId: state.packId,
    status: state.status,
    images: state.images ?? [],
    failureReason: state.failureReason,
    brand_name: state.brief.brand_name,
    deliveredAt: state.deliveredAt,
  });
}
