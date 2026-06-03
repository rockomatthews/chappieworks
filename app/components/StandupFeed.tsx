import Image from "next/image";
import { getStandups, type StandupBlock } from "@/app/lib/standups";

// Inline markdown: **bold**, `code`, and [text](href). Returns React nodes.
function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const regex = /(\*\*([^*]+)\*\*|`([^`]+)`|\[([^\]]+)\]\(([^)]+)\))/g;
  let last = 0;
  let key = 0;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > last) nodes.push(text.slice(last, m.index));
    if (m[2] !== undefined) {
      nodes.push(
        <strong key={key++} className="text-[var(--color-paper)] font-semibold">
          {m[2]}
        </strong>
      );
    } else if (m[3] !== undefined) {
      nodes.push(
        <code key={key++} className="mono text-[var(--color-gold)] text-[0.85em]">
          {m[3]}
        </code>
      );
    } else if (m[4] !== undefined) {
      const href = m[5];
      const external = href.startsWith("http");
      nodes.push(
        <a
          key={key++}
          href={href}
          target={external ? "_blank" : undefined}
          rel={external ? "noopener noreferrer" : undefined}
          className="text-[var(--color-gold)] hover:underline"
        >
          {m[4]}
        </a>
      );
    }
    last = regex.lastIndex;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Block({ block }: { block: StandupBlock }) {
  switch (block.type) {
    case "h2":
      return (
        <h3 className="text-sm font-semibold text-[var(--color-gold)] uppercase tracking-wide mt-5 first:mt-0">
          {renderInline(block.text)}
        </h3>
      );
    case "h3":
      return (
        <h4 className="text-sm font-semibold text-[var(--color-paper)] mt-4">
          {renderInline(block.text)}
        </h4>
      );
    case "ul":
      return (
        <ul className="mt-2 space-y-1.5 text-sm text-[var(--color-paper)]/80">
          {block.items.map((item, i) => (
            <li key={i} className="flex gap-2.5">
              <span aria-hidden="true" className="text-[var(--color-gold)] flex-shrink-0">
                ▸
              </span>
              <span>{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      );
    default:
      return (
        <p className="mt-3 text-sm text-[var(--color-paper)]/80 leading-relaxed">
          {renderInline(block.text)}
        </p>
      );
  }
}

export default function StandupFeed() {
  const standups = getStandups();
  if (standups.length === 0) return null;

  return (
    <section className="mt-16">
      <div className="flex items-center gap-2 text-xs mono text-[var(--color-gold)] uppercase tracking-widest">
        <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-gold)] inline-block animate-pulse" />
        Chappie · daily standup
      </div>
      <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight mt-3 mb-2">
        From the desk of Chappie
      </h2>
      <p className="text-sm text-[var(--color-paper)]/70 leading-relaxed mb-6">
        Every weekday at 8am MT, Chappie posts the studio standup — what shipped,
        what&rsquo;s in flight, what&rsquo;s blocked. Auto-committed by a scheduled
        agent. Money or it didn&rsquo;t happen.
      </p>

      <div className="space-y-3">
        {standups.map((s, i) => (
          <details
            key={s.slug}
            open={i === 0}
            className="card rounded-xl ring-1 ring-[var(--color-gold)]/20 overflow-hidden group"
          >
            <summary className="flex items-center gap-3 p-4 sm:p-5 cursor-pointer list-none select-none hover:bg-white/[0.02] transition">
              <div className="relative w-9 h-9 rounded-md overflow-hidden flex-shrink-0 ring-1 ring-[var(--color-gold)]/40">
                <Image
                  src="/profileShotChappie.png"
                  alt="Chappie"
                  fill
                  sizes="36px"
                  className="object-cover"
                />
              </div>
              <div className="min-w-0 flex-1">
                <span className="block text-[10px] mono text-[var(--color-mute)] uppercase tracking-widest">
                  {s.date}
                </span>
                <span className="block text-sm font-semibold text-[var(--color-paper)] truncate">
                  {s.title}
                </span>
              </div>
              <span
                aria-hidden="true"
                className="text-[var(--color-mute)] mono text-xs transition-transform group-open:rotate-90"
              >
                ▸
              </span>
            </summary>
            <div className="px-4 sm:px-5 pb-5 pt-1 border-t border-white/5">
              {s.blocks.map((block, idx) => (
                <Block key={idx} block={block} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
