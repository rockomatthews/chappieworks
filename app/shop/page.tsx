import type { Metadata } from "next";
import Image from "next/image";

const FOURTHWALL_URL = process.env.NEXT_PUBLIC_FOURTHWALL_URL ?? "#";

export const metadata: Metadata = {
  title: "Shop — Chappie Works",
  description:
    "Chappie merch. Tee, dad hat, hoodie. Black-on-black with the gold mech-with-shovel mark. Printed and shipped via Fourthwall.",
  alternates: { canonical: "https://chappieworks.com/shop" },
  openGraph: {
    title: "Shop — Chappie Works",
    description: "Tee, hat, hoodie. Wear the bird.",
    url: "https://chappieworks.com/shop",
    type: "website",
  },
};

type Product = {
  slug: string;
  name: string;
  price: string;
  blurb: string;
};

const PRODUCTS: Product[] = [
  {
    slug: "tee",
    name: "Chappie Tee",
    price: "$32",
    blurb:
      "Heavyweight black cotton tee. Gold mech-with-shovel printed center chest. Worn-in feel out of the box.",
  },
  {
    slug: "hat",
    name: "Chappie Dad Hat",
    price: "$36",
    blurb:
      "Unstructured 6-panel dad cap. Embroidered gold mark on the front. Curved brim, adjustable strap.",
  },
  {
    slug: "hoodie",
    name: "Chappie Hoodie",
    price: "$58",
    blurb:
      "Heavyweight black pullover hoodie. Large gold mark on the chest. Cotton-poly fleece, kangaroo pocket.",
  },
];

export default function Shop() {
  const storeLive = FOURTHWALL_URL !== "#";
  return (
    <main className="px-6 sm:px-10 py-16 sm:py-24">
      <div className="max-w-5xl mx-auto">
        <header className="mb-12 sm:mb-16">
          <p className="text-xs sm:text-sm mono text-[var(--color-gold)] mb-4 uppercase tracking-widest">
            Merch
          </p>
          <h1 className="text-4xl sm:text-5xl tracking-tight font-semibold leading-[1.08] mb-5">
            Wear the bird.
          </h1>
          <p className="text-base sm:text-lg text-[var(--color-paper)]/80 max-w-2xl">
            Three pieces. Printed on demand, shipped via Fourthwall. No
            warehouse, no leftovers, no landfill.
          </p>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRODUCTS.map((p) => (
            <article
              key={p.slug}
              className="card rounded-lg p-5 flex flex-col"
            >
              <div className="aspect-square rounded-md bg-[var(--color-raven)] flex items-center justify-center mb-5 overflow-hidden">
                <Image
                  src="/chappieworks-logo.png"
                  alt={`${p.name} preview`}
                  width={220}
                  height={220}
                  className="opacity-90"
                />
              </div>
              <div className="flex items-baseline justify-between gap-3 mb-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {p.name}
                </h2>
                <span className="mono text-[var(--color-gold)] text-sm">
                  {p.price}
                </span>
              </div>
              <p className="text-sm text-[var(--color-paper)]/75 mb-5 flex-1">
                {p.blurb}
              </p>
              {storeLive ? (
                <a
                  href={`${FOURTHWALL_URL}/products/${p.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mono text-sm text-[var(--color-gold)] hover:underline"
                >
                  Buy on Fourthwall →
                </a>
              ) : (
                <span className="mono text-sm text-[var(--color-mute)]">
                  Dropping soon
                </span>
              )}
            </article>
          ))}
        </div>

        <p className="mt-12 text-xs mono text-[var(--color-mute)]">
          Fulfilled by Fourthwall. Print quality, sizing, and shipping are
          theirs; the bird is ours.
        </p>
      </div>
    </main>
  );
}
