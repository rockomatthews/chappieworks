import { NextResponse, after } from "next/server";
import {
  newJobId,
  uploadAsset,
  writeState,
  type PhotoshootState,
} from "../../../lib/photoshoots";
import { runFreePreview } from "../../../lib/photoshootRun";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const MAX_ASSET_BYTES = 8 * 1024 * 1024;
const MAX_ASSETS = 5;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp"]);

export async function POST(req: Request) {
  if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "generator offline — try again shortly" },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") ?? "";
  let brandName = "";
  let brandDescription = "";
  let industry = "";
  let vibe = "";
  let colorPalette = "";
  let email = "";
  let logoFile: File | null = null;
  const photoFiles: File[] = [];

  if (contentType.includes("multipart/form-data")) {
    const form = await req.formData();
    brandName = String(form.get("brand_name") ?? "").trim();
    brandDescription = String(form.get("brand_description") ?? "").trim();
    industry = String(form.get("industry") ?? "").trim();
    vibe = String(form.get("vibe") ?? "").trim();
    colorPalette = String(form.get("color_palette") ?? "").trim();
    email = String(form.get("email") ?? "").trim().toLowerCase();
    const logo = form.get("logo");
    if (logo instanceof File && logo.size > 0) logoFile = logo;
    for (const v of form.getAll("photos")) {
      if (v instanceof File && v.size > 0) photoFiles.push(v);
    }
  } else {
    const body = (await req.json().catch(() => ({}))) as Record<string, string>;
    brandName = (body.brand_name ?? "").trim();
    brandDescription = (body.brand_description ?? "").trim();
    industry = (body.industry ?? "").trim();
    vibe = (body.vibe ?? "").trim();
    colorPalette = (body.color_palette ?? "").trim();
    email = (body.email ?? "").trim().toLowerCase();
  }

  if (!brandName || !brandDescription) {
    return NextResponse.json(
      { error: "brand name and a short description are required" },
      { status: 400 },
    );
  }

  const allFiles = [logoFile, ...photoFiles].filter(Boolean) as File[];
  if (allFiles.length > MAX_ASSETS + 1) {
    return NextResponse.json({ error: `upload at most ${MAX_ASSETS} photos + a logo` }, { status: 400 });
  }
  for (const f of allFiles) {
    if (!ALLOWED.has(f.type)) {
      return NextResponse.json({ error: "assets must be PNG, JPG, or WebP" }, { status: 400 });
    }
    if (f.size > MAX_ASSET_BYTES) {
      return NextResponse.json({ error: "each asset must be under 8 MB" }, { status: 400 });
    }
  }

  const jobId = newJobId();

  // Upload assets to blob → reference URLs the generator uses.
  let logoUrl: string | undefined;
  const assetUrls: string[] = [];
  try {
    let idx = 0;
    if (logoFile) {
      const buf = Buffer.from(await logoFile.arrayBuffer());
      logoUrl = await uploadAsset(jobId, idx++, buf, logoFile.type);
    }
    for (const p of photoFiles) {
      const buf = Buffer.from(await p.arrayBuffer());
      assetUrls.push(await uploadAsset(jobId, idx++, buf, p.type));
    }
  } catch (err) {
    console.error("[chappieworks:photoshoot] asset upload failed", jobId, err);
    return NextResponse.json(
      { error: "couldn't upload your assets — try smaller files" },
      { status: 500 },
    );
  }

  const state: PhotoshootState = {
    jobId,
    createdAt: new Date().toISOString(),
    brand_name: brandName,
    brand_description: brandDescription,
    industry: industry || undefined,
    vibe: vibe || undefined,
    color_palette: colorPalette || undefined,
    email: email || undefined,
    logoUrl,
    assetUrls: assetUrls.length ? assetUrls : undefined,
    status: "pending",
    images: [],
    packageStatus: "idle",
  };
  await writeState(state);

  after(() =>
    runFreePreview(jobId).catch((err) =>
      console.error("[chappieworks:photoshoot] runFreePreview threw", jobId, err),
    ),
  );

  console.log("[chappieworks:photoshoot] queued", jobId, brandName, "assets", allFiles.length);
  return NextResponse.json({ jobId });
}
