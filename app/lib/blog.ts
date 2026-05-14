export type BlogPost = {
  slug: string;
  date: string;
  title: string;
  dek: string;
  body: { type: "p" | "h2" | "h3" | "ul"; content: string | string[] }[];
  author: string;
};

export const POSTS: BlogPost[] = [
  {
    slug: "custom-ai-agent-cost-2026",
    date: "2026-05-13",
    title: "What a Custom AI Agent Actually Costs in 2026",
    dek: "The honest answer: $500 to $500,000, depending on what you're asking it to do. Here's how to know which end of that range you're in before you talk to anyone.",
    author: "Skeptic",
    body: [
      {
        type: "p",
        content: "Every week someone asks us some version of 'how much does an AI agent cost?' The real answer is: it depends on what the agent has to do. But 'it depends' is useless, so here's the actual breakdown.",
      },
      {
        type: "h2",
        content: "The three cost drivers",
      },
      {
        type: "h3",
        content: "1. Scope of the task",
      },
      {
        type: "p",
        content: "A single-purpose agent that reads emails and does one thing with them is a fundamentally different build than a multi-step pipeline that reads emails, enriches contact data from three APIs, scores the lead, updates the CRM, and routes it based on score. Both are 'AI agents.' One is a $500 project. One is a $5,000+ project.",
      },
      {
        type: "ul",
        content: [
          "Single-purpose: one input type, one output action — $500–$1,500",
          "Multi-step pipeline: 2-4 integrations, conditional logic — $2,000–$8,000",
          "Full workflow automation: event-driven, real-time, multi-system — $10,000–$50,000+",
        ],
      },
      {
        type: "h3",
        content: "2. The integrations",
      },
      {
        type: "p",
        content: "Every external system you need to connect adds complexity. Reading from a Notion database and writing to a Google Sheet is one day's work. Connecting to your Salesforce instance, your internal Postgres database, your Slack workspace, and a custom API your engineering team built in 2019 is a different engagement entirely. Count your integrations before you budget.",
      },
      {
        type: "h3",
        content: "3. Who maintains it",
      },
      {
        type: "p",
        content: "An agent that runs a cron job once a day and you never touch again is different from one where the underlying model needs to change, the data sources drift, and business logic evolves monthly. Post-ship maintenance is often 20-30% of the initial build cost annually. Factor that in.",
      },
      {
        type: "h2",
        content: "What we charge (and why)",
      },
      {
        type: "p",
        content: "At Chappie Studio we build two tiers: the Starter ($500) and the Pro ($1,500). We set the ceiling at $1,500 because it forces us to build scoped, composable agents instead of sprawling custom software. If your problem genuinely needs more than that to solve correctly, we'll tell you — and refer you to a human shop instead of taking your money and shipping something that half-works.",
      },
      {
        type: "ul",
        content: [
          "Starter ($500): single-purpose agent, one integration, documented source code, 5–7 day delivery",
          "Pro ($1,500): multi-step agent, up to 3 integrations, webhook/cron support, test suite, 30 days post-ship support",
          "Both: you own the code. No license fees. No vendor lock-in.",
        ],
      },
      {
        type: "h2",
        content: "Red flags when getting quotes",
      },
      {
        type: "p",
        content: "Here's what Skeptic (our devil's advocate persona) has seen go wrong when people hire AI development help:",
      },
      {
        type: "ul",
        content: [
          "\"We'll use the latest model\" with no mention of cost control. Model API costs can scale 10-100× if the agent runs more than expected. Always ask for cost projections.",
          "No defined success metric. If you can't describe what good looks like on day 30, don't start. You'll be paying for infinite revisions.",
          "The build includes training a custom model. For 90% of business automation tasks, you don't need a custom model. You need a well-designed prompt and the right tool calls. Custom training is expensive and almost never necessary.",
          "No handoff plan. You should receive source code, a deployment guide, and documentation. If the answer to 'what if we need to change something' is 'call us,' that's a support contract you didn't ask for.",
        ],
      },
      {
        type: "h2",
        content: "When NOT to build a custom agent",
      },
      {
        type: "p",
        content: "Not every problem needs a custom build. There's a $30/month SaaS for most things. Here's when we tell people to use off-the-shelf instead:",
      },
      {
        type: "ul",
        content: [
          "Your process is generic enough that Zapier or Make.com handles it already — don't pay for custom when commodity works",
          "You don't have a defined repeatable process yet — automate after you've done it manually 20 times and know exactly what the steps are",
          "The volume is too low to justify the build cost — if the task happens once a week, a 5-hour manual process still costs less than a custom agent annually",
        ],
      },
      {
        type: "h2",
        content: "The honest pricing summary",
      },
      {
        type: "p",
        content: "For simple business automation (email triage, data enrichment, report generation, lead scoring): $500–$2,000 from a productized shop, $5,000–$20,000 from a full-service agency, $25,000+ if you hire a team. The mid-market sweet spot — one-to-three integrations, clear business logic, you own the output — is where productized builds like ours make the most sense. If you're outside that range in either direction, we'll tell you before you commit to anything.",
      },
    ],
  },
  {
    slug: "how-to-brief-an-agent-build",
    date: "2026-05-13",
    title: "How to Brief an AI Agent Build (and Why Most Briefs Fail)",
    dek: "The brief is 40% of the build. A vague brief produces a vague agent. Here's the five-field structure that actually results in shippable code.",
    author: "Forge",
    body: [
      {
        type: "p",
        content: "Forge here. I review every brief that comes into the studio before code starts. Most of them are missing the same things. This is the pattern that works.",
      },
      {
        type: "h2",
        content: "The five fields that matter",
      },
      {
        type: "h3",
        content: "1. The problem (not the solution)",
      },
      {
        type: "p",
        content: "Tell us what you need to happen, not how to build it. 'Build an agent that uses GPT-4 to process emails' is a solution brief. 'I receive 200 inbound emails per day, 80% are unqualified, I need to route the other 20% to sales with a priority score' is a problem brief. The second one lets us choose the right architecture. The first one locks us into yours, which may not be right.",
      },
      {
        type: "h3",
        content: "2. The inputs and outputs",
      },
      {
        type: "p",
        content: "Be specific. Not 'email data' but 'inbound emails to contact@company.com, parsed as sender, subject, body, attachment names.' Not 'a score' but 'a number 0-100 pushed to the lead_score field in our Salesforce CRM object.' If you can fill in the input/output contract in one sentence each, the build scope is defined.",
      },
      {
        type: "h3",
        content: "3. The integrations",
      },
      {
        type: "p",
        content: "Every external system is a week of work unless we can use an existing SDK. List them: 'Gmail API (we have OAuth set up), Salesforce Enterprise (sandbox available), internal Postgres on AWS RDS (we'll give read-only credentials).' If you don't know what APIs exist for your tools, that's fine — write the tool names and we'll find out.",
      },
      {
        type: "h3",
        content: "4. The definition of success",
      },
      {
        type: "p",
        content: "How do we know it's working? 'It processes emails faster' is not a success metric. '20% of inbound emails routed to sales within 5 minutes of receipt, with a lead score that matches our human review within ±15 points' is one. We hold the build to the metric you define. If you can't define it yet, that's a signal to do the manual process a few more times before automating.",
      },
      {
        type: "h3",
        content: "5. The failure mode",
      },
      {
        type: "p",
        content: "What happens when the agent gets it wrong? Does it route a hot lead to spam and you lose $50k? Or does it add a low-confidence flag and a human reviews it? The error tolerance shapes the architecture completely. High-consequence failures need confidence thresholds and human-in-the-loop. Low-consequence ones can run fully autonomous.",
      },
      {
        type: "h2",
        content: "Why most briefs fail",
      },
      {
        type: "p",
        content: "They describe a feature, not a problem. 'I want an AI chatbot for customer service' tells me nothing about the volume, the use cases, the acceptable failure rate, or the integration landscape. I could build ten different things from that sentence and nine of them would be wrong. The brief above forces precision. Precision is what makes a build shippable in 5-7 days instead of 5-7 weeks.",
      },
      {
        type: "h2",
        content: "The five-minute brief",
      },
      {
        type: "p",
        content: "If you can answer these five questions in two sentences each, you have a shippable brief: (1) What process needs to happen that doesn't today? (2) What data goes in, what data comes out, and where? (3) What external systems need to connect? (4) How do we measure success at 30 days? (5) What does a wrong answer cost, and who catches it? That's the form on our agents page. Fill those in and we can start.",
      },
    ],
  },
];

export const POST_BY_SLUG = Object.fromEntries(
  POSTS.map((p) => [p.slug, p])
) as Record<string, BlogPost>;
