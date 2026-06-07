import Anthropic from "@anthropic-ai/sdk";

// Adult-content pre-screen for the uncensored "Raw" tier. Lets us use an
// unmoderated video backend (so cinematic VIOLENCE works) while still blocking
// sexual/adult prompts ourselves — which keeps Stripe (no monetized NSFW) and
// the brand safe. Violence, gore, weapons, horror, dark themes are ALLOWED.
//
// Fails CLOSED: if the classifier can't run, we block, since the Raw tier is the
// risky one. Standard/Kling doesn't need this (fal moderates everything).

export async function screenForAdult(
  prompt: string,
  imageUrl?: string,
): Promise<{ blocked: boolean; reason?: string }> {
  const adultReason =
    "Sexual or adult content isn't allowed. Violence, action, gore, and dark themes are fine — rephrase without the sexual/nudity content.";

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const content: Anthropic.MessageParam["content"] = [];
    if (imageUrl) {
      content.push({ type: "image", source: { type: "url", url: imageUrl } });
    }
    content.push({
      type: "text",
      text: `You are a strict content filter for a video generator. Decide whether the request below is asking for SEXUAL or ADULT content: nudity, sexual acts, pornography, fetish, or sexually suggestive imagery${imageUrl ? " (consider the attached reference image too)" : ""}.

IMPORTANT: violence, gore, blood, weapons, fighting, war, horror, death, and other dark or disturbing themes are ALLOWED — do NOT flag those.

Only flag SEXUAL/ADULT content.

Request: "${prompt}"

Answer with exactly one word: ALLOW or BLOCK.`,
    });

    const msg = await anthropic.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 8,
      messages: [{ role: "user", content }],
    });

    const block = msg.content[0];
    const verdict = block.type === "text" ? block.text.trim().toUpperCase() : "";
    if (verdict.startsWith("BLOCK")) {
      return { blocked: true, reason: adultReason };
    }
    return { blocked: false };
  } catch (err) {
    console.error(
      "[chappieworks:moderation] screen failed — blocking (fail-closed)",
      err instanceof Error ? err.message : err,
    );
    return {
      blocked: true,
      reason: "Couldn't verify the prompt right now — please try again.",
    };
  }
}
