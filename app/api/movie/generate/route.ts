import { NextResponse } from "next/server";
import Replicate from "replicate";
import {
  newJobId,
  writeState,
  type MovieState,
} from "../../../lib/movies";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const MAX_PROMPT_LEN = 800;
const MIN_PROMPT_LEN = 10;

// Runway Gen-3 on Replicate — text-to-video, ~$0.06 per generation
const MODEL =
  "runwayml/gen-3-turbo" as `${string}/${string}`;

type GenerateBody = {
  prompt?: string;
  email?: string;
};

export async function POST(req: Request) {
  let body: GenerateBody;
  try {
    body = (await req.json()) as GenerateBody;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const prompt = (body.prompt ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();

  if (!prompt || prompt.length < MIN_PROMPT_LEN) {
    return NextResponse.json(
      { error: `prompt must be at least ${MIN_PROMPT_LEN} characters` },
      { status: 400 },
    );
  }
  if (prompt.length > MAX_PROMPT_LEN) {
    return NextResponse.json(
      { error: `prompt must be under ${MAX_PROMPT_LEN} characters` },
      { status: 400 },
    );
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "valid email is required" },
      { status: 400 },
    );
  }

  const apiToken = process.env.REPLICATE_API_TOKEN;
  if (!apiToken) {
    console.error("[chappieworks:movie] REPLICATE_API_TOKEN missing");
    return NextResponse.json(
      { error: "generator offline — try again shortly" },
      { status: 503 },
    );
  }

  const replicate = new Replicate({ auth: apiToken });
  const jobId = newJobId();

  try {
    const prediction = await replicate.predictions.create({
      model: MODEL,
      input: {
        prompt,
      },
    });

    const state: MovieState = {
      jobId,
      prompt,
      email,
      createdAt: new Date().toISOString(),
      replicateId: prediction.id,
      status: "generating",
      paid: false,
    };
    await writeState(state);

    console.log(
      "[chappieworks:movie] created job",
      jobId,
      "replicate",
      prediction.id,
    );

    return NextResponse.json({ jobId });
  } catch (err) {
    const message = err instanceof Error ? err.message : "unknown";
    console.error("[chappieworks:movie] create prediction failed", message);
    return NextResponse.json(
      { error: `couldn't start generation: ${message}` },
      { status: 502 },
    );
  }
}
