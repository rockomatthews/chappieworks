import Link from "next/link";
import { PERSONAS, type Persona } from "../lib/personas";

export function CreditedBy({ slugs }: { slugs: Persona["slug"][] }) {
  const credited = slugs
    .map((s) => PERSONAS.find((p) => p.slug === s))
    .filter((p): p is Persona => Boolean(p));

  return (
    <p className="text-xs mono text-[--color-mute] mt-6 text-center">
      Worked on by{" "}
      {credited.map((p, i) => (
        <span key={p.slug}>
          <Link
            href={`/studio#${p.slug}`}
            className={
              p.accent === "gold"
                ? "text-[--color-gold] hover:underline"
                : "text-[--color-rust] hover:underline"
            }
          >
            {p.name}
          </Link>
          {i < credited.length - 2
            ? ", "
            : i === credited.length - 2
            ? " &  "
            : ""}
        </span>
      ))}
      .{" "}
      <Link
        href="/studio"
        className="underline-offset-2 hover:underline"
      >
        Meet the studio →
      </Link>
    </p>
  );
}
