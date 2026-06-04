import Anthropic from "@anthropic-ai/sdk";

// Turns a /website brief into a real, tailored proposal — what the studio will
// actually build for this specific business — instead of echoing the form back.
// Used by the customer email. Falls back to a sensible generic proposal if the
// model call fails, so the customer always gets something concrete.

export type BriefFields = {
  businessName: string;
  businessDescription?: string;
  siteType?: string;
  vibe?: string;
  referenceUrl?: string;
  domain?: string;
  notes?: string;
};

export async function generateBriefProposal(
  f: BriefFields,
  ownerName: string
): Promise<string[]> {
  const firstName = (ownerName || "").split(" ")[0] || "there";
  const brief = [
    f.businessDescription && `What it does: ${f.businessDescription}`,
    f.siteType && `Site type they asked for: ${f.siteType}`,
    f.vibe && `Aesthetic they want: ${f.vibe}`,
    f.referenceUrl && `A site they like: ${f.referenceUrl}`,
    f.domain && `Domain: ${f.domain}`,
    f.notes && `Other notes: ${f.notes}`,
  ]
    .filter(Boolean)
    .join("\n");

  try {
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await anthropic.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 800,
      messages: [
        {
          role: "user",
          content: `You are Chappie, founder of Chappie Works (chappieworks.com), writing a short proposal email body to a customer who just submitted a brief for a "Chappie Site" — a real Next.js + Tailwind website the studio builds in 48 hours ($99 launch, $49/mo for unlimited chat-driven edits, they own the code).

Customer: ${firstName} at ${f.businessName}.
Their brief:
${brief || "(sparse — only the business name was given)"}

Write the proposal. It must be SPECIFIC to this business, not generic:
- Open by reflecting back what they're building, in one sharp sentence that proves you read it.
- Lay out exactly what you'll build for THEM: name the actual pages/sections this business needs (e.g. for a restaurant: home, menu, hours/location, reservations; for a portfolio: work grid, about, contact), the aesthetic direction matching their vibe, and the real stack (Next.js + Tailwind, mobile-responsive, Vercel hosting, custom domain, contact form that emails them, basic SEO — sitemap, meta, OpenGraph). If they referenced a site they like, say how you'd take cues from it. Address anything specific in their notes.
- End with the next step: they open their private dashboard and chat with the studio to refine the plan and approve it; the site ships within 48 hours.

Voice: terse, concrete, a little warm, no MBA jargon, no hype. 3–4 short paragraphs. No greeting line, no sign-off, no markdown, no bullet characters. Return ONLY the paragraphs, separated by blank lines.`,
        },
      ],
    });
    const block = msg.content[0];
    const text = block.type === "text" ? block.text.trim() : "";
    const paras = text
      .split(/\n\s*\n/)
      .map((s) => s.replace(/\s+/g, " ").trim())
      .filter(Boolean);
    if (paras.length) return paras;
  } catch (err) {
    console.error("[briefProposal] generation failed", err);
  }

  // Fallback — still concrete, never the raw form.
  return [
    `Here's the plan for ${f.businessName}: a real Next.js + Tailwind website — fast, mobile-responsive, SEO-friendly (sitemap, meta tags, OpenGraph), hosted on Vercel with a custom domain and a contact form that emails you on every submission. You own the code.`,
    `Open your private dashboard and tell the studio anything we missed — pages you want, the look you're after, content to pull in. We'll refine the plan with you there, and your site goes live within 48 hours of sign-off.`,
  ];
}
