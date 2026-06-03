import fs from "fs";
import path from "path";

// Reads the daily Chappie standups committed to /studio-standups by the
// "Daily Chappie Standup" scheduled remote agent (replaces the OpenClaw
// heartbeat). Each run commits one `YYYY-MM-DD.md` file to main; a fresh
// Vercel build then renders them on /studio/queue. No markdown lib — the
// format is constrained by the agent prompt, so a small forgiving parser
// keeps the dependency surface at zero and degrades to paragraphs.

export type StandupBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] };

export type Standup = {
  slug: string; // "2026-06-03"
  date: string; // "2026-06-03"
  title: string; // derived from a leading `# heading` or a default
  blocks: StandupBlock[];
};

const DIR = path.join(process.cwd(), "studio-standups");

export function getStandups(): Standup[] {
  let files: string[];
  try {
    files = fs.readdirSync(DIR).filter((f) => f.endsWith(".md"));
  } catch {
    return []; // dir not present yet — render nothing
  }

  const standups = files
    .map((file) => {
      try {
        return parseStandup(file, fs.readFileSync(path.join(DIR, file), "utf8"));
      } catch {
        return null;
      }
    })
    .filter((s): s is Standup => s !== null);

  // Newest first — filenames are ISO dates, so a string sort is a date sort.
  standups.sort((a, b) => (a.slug < b.slug ? 1 : -1));
  return standups;
}

function stripInlineMd(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .trim();
}

function parseStandup(file: string, raw: string): Standup {
  const slug = file.replace(/\.md$/, "");
  const date = slug.match(/\d{4}-\d{2}-\d{2}/)?.[0] ?? slug;

  const blocks: StandupBlock[] = [];
  let title = `Standup — ${date}`;
  let para: string[] = [];
  let list: string[] = [];

  const flushPara = () => {
    if (para.length) {
      blocks.push({ type: "p", text: para.join(" ").trim() });
      para = [];
    }
  };
  const flushList = () => {
    if (list.length) {
      blocks.push({ type: "ul", items: list.slice() });
      list = [];
    }
  };

  for (const rawLine of raw.split("\n")) {
    const t = rawLine.trim();
    if (!t) {
      flushPara();
      flushList();
      continue;
    }

    const heading = t.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      const text = heading[2].trim();
      if (heading[1].length === 1) {
        title = stripInlineMd(text); // top-level title, not rendered as a block
      } else {
        blocks.push({ type: heading[1].length === 2 ? "h2" : "h3", text });
      }
      continue;
    }

    const bullet = t.match(/^([-*▸•])\s+(.*)$/);
    if (bullet) {
      flushPara();
      list.push(bullet[2].trim());
      continue;
    }

    // plain paragraph line
    flushList();
    para.push(t);
  }

  flushPara();
  flushList();
  return { slug, date, title, blocks };
}
