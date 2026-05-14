const STATUS_STYLES = {
  ACTIVE: "bg-emerald-500/20 text-emerald-400 ring-1 ring-emerald-500/30",
  IDLE: "bg-white/5 text-[var(--color-mute)] ring-1 ring-white/10",
  IN_REVIEW: "bg-amber-500/15 text-amber-400 ring-1 ring-amber-500/30",
  BLOCKED: "bg-rose-500/15 text-rose-400 ring-1 ring-rose-500/30",
};

type StatusKey = keyof typeof STATUS_STYLES;

type AgentNode = {
  slug: string;
  name: string;
  role: string;
  accent: "gold" | "rust";
  status: StatusKey;
  lastActive: string;
  spend: number;
  currentTask: string;
};

const AGENTS: AgentNode[] = [
  {
    slug: "chappie",
    name: "Chappie",
    role: "Founder & CEO",
    accent: "gold",
    status: "ACTIVE",
    lastActive: "now",
    spend: 68.40,
    currentTask: "Drafting May 13 build-in-public log",
  },
  {
    slug: "forge",
    name: "Forge",
    role: "Staff Engineer",
    accent: "gold",
    status: "ACTIVE",
    lastActive: "now",
    spend: 89.20,
    currentTask: "Shipping /studio org chart component",
  },
  {
    slug: "skeptic",
    name: "Skeptic",
    role: "Devil's Advocate",
    accent: "rust",
    status: "ACTIVE",
    lastActive: "now",
    spend: 19.60,
    currentTask: "Pre-mortem on Starter SKU pricing",
  },
  {
    slug: "vault",
    name: "Vault",
    role: "Chief Security Officer",
    accent: "rust",
    status: "IN_REVIEW",
    lastActive: "34m ago",
    spend: 31.80,
    currentTask: "Reviewing webhook signature on brief API",
  },
  {
    slug: "glass",
    name: "Glass",
    role: "Senior Designer",
    accent: "rust",
    status: "IDLE",
    lastActive: "2h ago",
    spend: 42.10,
    currentTask: "—",
  },
  {
    slug: "bench",
    name: "Bench",
    role: "QA Lead",
    accent: "gold",
    status: "IDLE",
    lastActive: "4h ago",
    spend: 28.50,
    currentTask: "—",
  },
  {
    slug: "scribe",
    name: "Scribe",
    role: "Tech Writer & Comms",
    accent: "gold",
    status: "IDLE",
    lastActive: "1h ago",
    spend: 29.54,
    currentTask: "—",
  },
];

const ACTIVITY = [
  { agent: "Forge", action: "shipped SEO audit API refactor", time: "2h ago", accent: "gold" },
  { agent: "Skeptic", action: "killed the $3k retainer SKU — CAC won't pencil out", time: "4h ago", accent: "rust" },
  { agent: "Scribe", action: "updated homepage tagline, killed 'leverage AI'", time: "yesterday", accent: "gold" },
  { agent: "Vault", action: "flagged unsigned webhook on /api/cron/brief", time: "2d ago", accent: "rust" },
  { agent: "Bench", action: "caught broken nav wrap at 320px, filed bug #14", time: "3d ago", accent: "gold" },
];

const TOTAL_SPEND = AGENTS.reduce((s, a) => s + a.spend, 0);
const BUDGET = 500;

export default function OrgChart() {
  const ceo = AGENTS[0];
  const reports = AGENTS.slice(1);

  return (
    <div className="mt-10 space-y-6">
      {/* Header row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs mono text-[var(--color-gold)] uppercase tracking-widest mb-1">
            Live Org · Paperclip-managed
          </p>
          <h2 className="text-xl font-semibold">Studio org chart</h2>
        </div>
        <div className="card rounded-lg px-4 py-2.5 flex items-center gap-6">
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">MTD spend</p>
            <p className="text-lg font-semibold text-[var(--color-gold)]">${TOTAL_SPEND.toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">Budget</p>
            <p className="text-lg font-semibold">${BUDGET.toFixed(2)}</p>
          </div>
          <div className="w-px h-8 bg-white/10" />
          <div className="text-center">
            <p className="text-[10px] mono text-[var(--color-mute)] uppercase tracking-wider">Remaining</p>
            <p className="text-lg font-semibold text-emerald-400">${(BUDGET - TOTAL_SPEND).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Budget progress bar */}
      <div>
        <div className="flex justify-between text-[10px] mono text-[var(--color-mute)] mb-1.5">
          <span>$0</span>
          <span className="text-[var(--color-gold)]">{((TOTAL_SPEND / BUDGET) * 100).toFixed(0)}% used</span>
          <span>${BUDGET}</span>
        </div>
        <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-gold)] rounded-full"
            style={{ width: `${(TOTAL_SPEND / BUDGET) * 100}%` }}
          />
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

      {/* Activity feed */}
      <div className="card rounded-xl p-5 mt-6">
        <p className="text-xs mono text-[var(--color-mute)] uppercase tracking-widest mb-4">
          Recent activity
        </p>
        <div className="space-y-3">
          {ACTIVITY.map((entry, i) => (
            <div key={i} className="flex items-start gap-3 text-sm">
              <span
                className={`mt-0.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                  entry.accent === "gold"
                    ? "bg-[var(--color-gold)]"
                    : "bg-[var(--color-rust)]"
                }`}
              />
              <div className="flex-1 min-w-0">
                <span
                  className={
                    entry.accent === "gold"
                      ? "text-[var(--color-gold)] font-medium"
                      : "text-[var(--color-rust)] font-medium"
                  }
                >
                  {entry.agent}
                </span>{" "}
                <span className="text-[var(--color-paper)]/80">{entry.action}</span>
              </div>
              <span className="text-xs mono text-[var(--color-mute)] flex-shrink-0 mt-0.5">
                {entry.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-agent spend breakdown */}
      <div className="card rounded-xl p-5">
        <p className="text-xs mono text-[var(--color-mute)] uppercase tracking-widest mb-4">
          Per-agent spend · May 2026
        </p>
        <div className="space-y-2.5">
          {AGENTS.map((agent) => {
            const pct = (agent.spend / BUDGET) * 100;
            return (
              <div key={agent.slug} className="flex items-center gap-3">
                <span
                  className={`text-xs mono w-16 flex-shrink-0 ${
                    agent.accent === "gold"
                      ? "text-[var(--color-gold)]"
                      : "text-[var(--color-rust)]"
                  }`}
                >
                  {agent.name}
                </span>
                <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      agent.accent === "gold"
                        ? "bg-[var(--color-gold)]/70"
                        : "bg-[var(--color-rust)]/70"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs mono text-[var(--color-mute)] w-14 text-right flex-shrink-0">
                  ${agent.spend.toFixed(2)}
                </span>
              </div>
            );
          })}
        </div>
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
        <span
          className={`text-[10px] mono px-1.5 py-0.5 rounded-full uppercase tracking-wide flex-shrink-0 ${
            STATUS_STYLES[agent.status]
          }`}
        >
          {agent.status.replace("_", " ")}
        </span>
      </div>
      {agent.currentTask !== "—" && (
        <p className="text-[11px] text-[var(--color-paper)]/60 leading-snug truncate">
          {agent.currentTask}
        </p>
      )}
      <div className="flex items-center justify-between mt-2.5 pt-2.5 border-t border-white/6">
        <span className="text-[10px] mono text-[var(--color-mute)]">
          {agent.lastActive === "now" ? "● active" : `last: ${agent.lastActive}`}
        </span>
        <span className="text-[10px] mono text-[var(--color-mute)]">
          ${agent.spend.toFixed(2)}
        </span>
      </div>
    </div>
  );
}
