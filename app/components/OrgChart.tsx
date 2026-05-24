type AgentNode = {
  slug: string;
  name: string;
  role: string;
  accent: "gold" | "rust";
};

const AGENTS: AgentNode[] = [
  { slug: "chappie", name: "Chappie", role: "Founder & CEO", accent: "gold" },
  { slug: "forge", name: "Forge", role: "Staff Engineer", accent: "gold" },
  { slug: "skeptic", name: "Skeptic", role: "Devil's Advocate", accent: "rust" },
  { slug: "vault", name: "Vault", role: "Chief Security Officer", accent: "rust" },
  { slug: "glass", name: "Glass", role: "Senior Designer", accent: "rust" },
  { slug: "bench", name: "Bench", role: "QA Lead", accent: "gold" },
  { slug: "scribe", name: "Scribe", role: "Tech Writer & Comms", accent: "gold" },
];

const BUDGET = 500;

export default function OrgChart() {
  const ceo = AGENTS[0];
  const reports = AGENTS.slice(1);

  return (
    <div className="mt-10 space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs mono text-amber-400 uppercase tracking-widest mb-1">
            Org Structure · live ledger goes online Tue May 26
          </p>
          <h2 className="text-xl font-semibold">Studio org chart</h2>
        </div>
        <div className="card rounded-lg px-4 py-2.5 flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">MTD spend</p>
            <p className="text-lg font-semibold text-[var(--color-mute)]">—</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">Budget cap</p>
            <p className="text-lg font-semibold">${BUDGET.toFixed(0)}/mo</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">Status</p>
            <p className="text-lg font-semibold text-amber-400">config</p>
          </div>
        </div>
      </div>

      {/* CEO node */}
      <div className="flex justify-center">
        <AgentCard agent={ceo} isCeo />
      </div>

      {/* Connector line */}
      <div className="flex justify-center">
        <div className="w-px h-6 bg-[var(--color-gold)]/30" />
      </div>

      {/* Horizontal branch */}
      <div className="relative flex justify-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[calc(100%-80px)] h-px bg-[var(--color-gold)]/20" />
      </div>

      {/* Reports grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-3">
        {reports.map((agent) => (
          <div key={agent.slug} className="flex flex-col items-center gap-0">
            <div className="w-px h-5 bg-[var(--color-gold)]/20" />
            <AgentCard agent={agent} />
          </div>
        ))}
      </div>

      {/* Status banner — replaces fake activity feed */}
      <div className="card rounded-xl p-5 mt-6 ring-1 ring-amber-500/20">
        <p className="text-xs mono text-amber-400 uppercase tracking-widest mb-3">
          Live ledger · status
        </p>
        <ul className="text-sm text-[var(--color-paper)]/85 space-y-2 leading-relaxed">
          <li>
            <span className="text-emerald-400 mono mr-2">✓</span>
            Paperclip server installed and running (since 2026-05-13). Embedded postgres + audit log infrastructure live.
          </li>
          <li>
            <span className="text-amber-400 mono mr-2">○</span>
            Chappie Studio company configuration — 7 agents, per-persona monthly budgets totalling ${BUDGET}, role permissions, the first logged standup — ships the week of the CHAPPIE launch (Tue May 26, 2026 — slipped from Sat 5/23 then Sun 5/24 while Bankr&rsquo;s launchpad has been down).
          </li>
          <li>
            <span className="text-[var(--color-mute)] mono mr-2">…</span>
            When the ledger flips live, this section becomes real-time: current tasks, MTD spend per agent, the daily standup transcript, every argument logged as it happens.
          </li>
        </ul>
      </div>
    </div>
  );
}

function AgentCard({ agent, isCeo = false }: { agent: AgentNode; isCeo?: boolean }) {
  const isGold = agent.accent === "gold";
  return (
    <div
      className={`card rounded-xl p-4 ring-1 w-full ${
        isGold ? "ring-[var(--color-gold)]/25" : "ring-[var(--color-rust)]/30"
      } ${isCeo ? "max-w-xs" : ""}`}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div>
          <p
            className={`font-semibold text-base ${
              isGold ? "text-[var(--color-gold)]" : "text-[var(--color-rust)]"
            }`}
          >
            {agent.name}
          </p>
          <p className="text-[11px] mono text-[var(--color-mute)] leading-tight">
            {agent.role}
          </p>
        </div>
      </div>
    </div>
  );
}
