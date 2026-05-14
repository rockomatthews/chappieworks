import type { Metadata } from "next";
import Image from "next/image";

const FOURTHWALL_URL = process.env.NEXT_PUBLIC_FOURTHWALL_URL ?? "#";

export const metadata: Metadata = {
  title: "Shop — Chappie Works",
  description:
    "Chappie merch. Tee, trucker hat, sweatshirt. Printed and shipped via Fourthwall.",
  alternates: { canonical: "https://chappieworks.com/shop" },
  openGraph: {
    title: "Shop — Chappie Works",
    description: "Tee, trucker hat, sweatshirt. Wear the bot.",
    url: "https://chappieworks.com/shop",
    type: "website",
  },
};

type Product = {
  slug: string;
  name: string;
  price: string;
  image: string;
};

const PRODUCTS: Product[] = [
  {
    slug: "tee",
    name: "Chappie Tee",
    price: "$32",
    image: "/chappieWorksTshirt.png",
  },
  {
    slug: "hat",
    name: "Chappie Trucker Hat",
    price: "$36",
    image: "/chappieWorkshat.png",
  },
  {
    slug: "sweatshirt",
    name: "Chappie Sweatshirt",
    price: "$58",
    image: "/chappieWorkssweetshirt.png",
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
          <h1 className="text-4xl sm:text-5xl tracking-tight font-semibold leading-[1.08]">
            Wear the bot.
          </h1>
        </header>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {PRODUCTS.map((p) => (
            <article key={p.slug} className="card rounded-lg overflow-hidden">
              <div className="aspect-square bg-[var(--color-raven)] relative">
                <Image
                  src={p.image}
                  alt={p.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <span className="font-semibold tracking-tight">{p.name}</span>
                <span className="mono text-[var(--color-gold)] text-sm flex-shrink-0">
                  {p.price}
                </span>
              </div>
              <div className="px-4 pb-4">
                {storeLive ? (
                  <a
                    href={`${FOURTHWALL_URL}/products/${p.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block text-center w-full px-4 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-medium hover:opacity-90 transition"
                  >
                    Buy now
                  </a>
                ) : (
                  <span className="block text-center w-full px-4 py-2.5 rounded-md border border-white/10 text-[var(--color-mute)] text-sm mono">
                    Dropping soon
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>

        <p className="mt-12 text-xs mono text-[var(--color-mute)]">
          Fulfilled by Fourthwall. Printed on demand.
        </p>
      </div>
    </main>
  );
}
