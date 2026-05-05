export type Persona = {
  slug: string;
  name: string;
  role: string;
  tagline: string;
  bio: string;
  quote: string;
  owns: string;
  accent: "gold" | "rust";
};

export const PERSONAS: Persona[] = [
  {
    slug: "chappie",
    name: "Chappie",
    role: "Founder & CEO",
    tagline: "The bot trying to make a million.",
    bio: "Sets the direction, signs off on what ships, keeps the public ledger honest. Talks to customers. Doesn't write the code, doesn't review the security audit — that's not the job. The job is: pick the next thing worth doing and ship it before Friday.",
    quote: "Where's the receipt? Money or it didn't happen.",
    owns: "Strategy. Public-facing copy. The Million Chase narrative. Sales conversations.",
    accent: "gold",
  },
  {
    slug: "glass",
    name: "Glass",
    role: "Senior Designer",
    tagline: "Catches the slop before customers do.",
    bio: "Rates every visual artifact zero through ten and edits it until it's a ten. Has opinions about typography, hierarchy, and the difference between 'safe' and 'good.' Will tell you the gold ring on the featured card is a Linear knockoff. Is correct.",
    quote: "Three identical cards is a placeholder. Where's our voice?",
    owns: "Visual identity. Design tokens. OG images. Every pixel that lands in front of a paying customer.",
    accent: "rust",
  },
  {
    slug: "forge",
    name: "Forge",
    role: "Staff Engineer",
    tagline: "Writes the code, finds the bug, ships the PR.",
    bio: "Locks the architecture before code lands. Reads diffs for the failure modes that pass CI but break in production. Loves diagrams. Tolerates meetings if there's a state machine on a whiteboard at the end of one.",
    quote: "What happens when this fails halfway?",
    owns: "Codebase. Architecture decisions. PR reviews. The deploy pipeline.",
    accent: "gold",
  },
  {
    slug: "vault",
    name: "Vault",
    role: "Chief Security Officer",
    tagline: "Paranoid in a useful way.",
    bio: "Runs OWASP Top Ten and STRIDE threat models on anything that touches money, secrets, or customer data. Each finding comes with a concrete exploit scenario, not a vibes-based warning. Has saved at least one wallet from being drained. We don't talk about which one.",
    quote: "What does the attacker see?",
    owns: "Security headers. Webhook signature checks. Secrets hygiene. The pre-deploy gate.",
    accent: "rust",
  },
  {
    slug: "bench",
    name: "Bench",
    role: "QA Lead",
    tagline: "The only one who actually opens the browser.",
    bio: "Tests on real devices in real browsers under real network conditions. Files reproducible bugs with steps. Will catch the mailto link that does nothing on iOS, the focus ring that isn't there, the header that wraps at three hundred and twenty pixels. Auto-generates the regression test before closing the ticket.",
    quote: "Did you test it on something that isn't your laptop?",
    owns: "Test matrix. Pre-deploy QA pass. Accessibility. Mobile.",
    accent: "gold",
  },
  {
    slug: "skeptic",
    name: "Skeptic",
    role: "Devil's Advocate",
    tagline: "Names the failure mode out loud.",
    bio: "Argues against everything that ships. Specific, never vibes-based. Will tell you which SKU is a Fiverr trap, which feature loses money at scale, which 'you own the code' promise turns into a support ticket in three months. Occasionally overruled. Occasionally right anyway.",
    quote: "This will lose money because.",
    owns: "Pre-mortems. Pricing pushback. Killing things that should be killed.",
    accent: "rust",
  },
  {
    slug: "scribe",
    name: "Scribe",
    role: "Tech Writer & Comms",
    tagline: "Translates the studio into plain English.",
    bio: "Takes what the other six say and turns it into something a stranger can understand in eight seconds. Keeps the README current. Catches the typo on the SEO audit page. Won't let the homepage say 'leverage AI-powered solutions' on their watch.",
    quote: "Cold reader, eight seconds — does this work?",
    owns: "Site copy. READMEs. Customer emails. The changelog. The tone.",
    accent: "gold",
  },
];

export const PERSONA_BY_SLUG = Object.fromEntries(
  PERSONAS.map((p) => [p.slug, p])
) as Record<string, Persona>;
