import { NextResponse } from "next/server";
import { after } from "next/server";
import {
  craftImagePrompts,
  generateImage,
  MODE_SPECS,
  PREVIEW_MODES,
} from "../../../lib/photoshootGen";
import {
  newJobId,
  readState,
  uploadImage,
  writeState,
  type PhotoshootImage,
  type PhotoshootState,
} from "../../../lib/photoshoots";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type Body = {
  name?: string;
  email?: string;
  brand_name?: string;
  brand_description?: string;
  industry?: string;
  vibe?: string;
  color_palette?: string;
  reference_url?: string;
};

export async function POST(req: Request) {
  let body: Body;
  try {
    body = (await req.json()) as Body;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const brandName = (body.brand_name ?? "").trim();
  const brandDescription = (body.brand_description ?? "").trim();

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "please include your name" }, { status: 400 });
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "valid email is required" }, { status: 400 });
  }
  if (!brandName || !brandDescription) {
    return NextResponse.json(
      { error: "brand name and description are required" },
      { status: 400 },
    );
  }

  if (!process.env.OPENAI_API_KEY || !process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "generator offline — try again shortly" },
      { status: 503 },
    );
  }

  const jobId = newJobId();
  const state: PhotoshootState = {
    jobId,
    createdAt: new Date().toISOString(),
    email,
    name,
    brand_name: brandName,
    brand_description: brandDescription,
    industry: body.industry?.trim() || undefined,
    vibe: body.vibe?.trim() || undefined,
    color_palette: body.color_palette?.trim() || undefined,
    reference_url: body.reference_url?.trim() || undefined,
    status: "pending",
    images: [],
  };
  await writeState(state);

  after(() => runGeneration(jobId).catch((err) => {
    console.error("[chappieworks:photoshoot] runGeneration threw", jobId, err);
  }));

  console.log("[chappieworks:photoshoot] queued job", jobId, "for", email);
  return NextResponse.json({ jobId });
}

async function runGeneration(jobId: string): Promise<void> {
  const state = await readState(jobId);
  if (!state) {
    console.error("[chappieworks:photoshoot] runGeneration: state missing", jobId);
    return;
  }
  await writeState({ ...state, status: "generating" });

  try {
    const prompts = await craftImagePrompts(state);
    const images: PhotoshootImage[] = [];
    for (const mode of PREVIEW_MODES) {
      const spec = MODE_SPECS[mode];
      const prompt = prompts[mode];
      const b64 = await generateImage(prompt, spec.size);
      const url = await uploadImage(jobId, mode, b64);
      images.push({ mode, modeLabel: spec.label, size: spec.size, url });
      const partial = await readState(jobId);
      if (partial) {
        await writeState({ ...partial, images: [...images] });
      }
    }
    const finalState = await readState(jobId);
    if (finalState) {
      await writeState({ ...finalState, status: "ready", images });
    }
    console.log("[chappieworks:photoshoot] ready", jobId, images.length);
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:photoshoot] failed", jobId, message);
    const current = await readState(jobId);
    if (current) {
      await writeState({ ...current, status: "failed", failureReason: message });
    }
  }
}
