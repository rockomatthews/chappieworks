"use client";

import Image from "next/image";
import { useState, useEffect, useCallback } from "react";

type FWImage = { id: string; url: string; width: number; height: number };
type FWVariant = { id: string; unitPrice: { value: number; currency: string } };

export type Product = {
  id: string;
  name: string;
  slug: string;
  images: FWImage[];
  variants: FWVariant[];
  shopDomain: string;
};

function formatPrice(variants: FWVariant[]): string {
  if (!variants.length) return "";
  const prices = variants.map((v) => v.unitPrice.value);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  const fmt = (n: number) =>
    new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
    }).format(n);
  return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}

function Lightbox({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [activeIdx, setActiveIdx] = useState(0);
  const price = formatPrice(product.variants);
  const images = product.images;

  const prev = useCallback(
    () => setActiveIdx((i) => (i - 1 + images.length) % images.length),
    [images.length]
  );
  const next = useCallback(
    () => setActiveIdx((i) => (i + 1) % images.length),
    [images.length]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose, prev, next]);

  const active = images[activeIdx];

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/90 sm:p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-4xl bg-[var(--color-raven)] rounded-t-2xl sm:rounded-xl flex flex-col sm:flex-row max-h-[92vh] sm:max-h-[88vh] overflow-y-auto sm:overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition"
          aria-label="Close"
        >
          ✕
        </button>

        {/* Main image — capped on mobile so panel + buy button stay visible */}
        <div className="relative sm:w-3/5 bg-[var(--color-raven)] flex-shrink-0 h-[40vh] sm:h-auto sm:aspect-[3/4]">
          {active && (
            <Image
              src={active.url}
              alt={product.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 60vw"
              priority
            />
          )}

          {/* Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={prev}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition text-lg"
                aria-label="Previous image"
              >
                ‹
              </button>
              <button
                onClick={next}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/80 transition text-lg"
                aria-label="Next image"
              >
                ›
              </button>
            </>
          )}
        </div>

        {/* Info panel — scrollable on mobile so Buy button is always reachable */}
        <div className="flex flex-col p-5 sm:p-6 sm:w-2/5 gap-3 overflow-y-auto">
          <div>
            <h2 className="text-xl font-semibold tracking-tight mb-1">
              {product.name}
            </h2>
            {price && (
              <p className="mono text-[var(--color-gold)]">{price}</p>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="flex flex-wrap gap-2">
              {images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setActiveIdx(i)}
                  className={`relative w-14 h-14 rounded overflow-hidden border-2 transition flex-shrink-0 ${
                    i === activeIdx
                      ? "border-[var(--color-gold)]"
                      : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <Image
                    src={img.url}
                    alt={`${product.name} view ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                </button>
              ))}
            </div>
          )}

          <div className="pt-3 mt-auto">
            <a
              href={`https://${product.shopDomain}/products/${product.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full px-4 py-3.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] font-semibold hover:opacity-90 transition text-base"
            >
              Buy now
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ShopGrid({ products }: { products: Product[] }) {
  const [active, setActive] = useState<Product | null>(null);

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {products.map((p) => {
          const price = formatPrice(p.variants);
          const img = p.images[0];
          return (
            <article key={p.id} className="card rounded-lg overflow-hidden group">
              <button
                className="block w-full text-left cursor-pointer"
                onClick={() => setActive(p)}
                aria-label={`View ${p.name}`}
              >
                <div className="aspect-square bg-[var(--color-raven)] relative overflow-hidden">
                  {img ? (
                    <Image
                      src={img.url}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-mute)] text-sm mono">
                      no image
                    </div>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between gap-3">
                  <span className="font-semibold tracking-tight">{p.name}</span>
                  {price && (
                    <span className="mono text-[var(--color-gold)] text-sm flex-shrink-0">
                      {price}
                    </span>
                  )}
                </div>
              </button>
              <div className="px-4 pb-4">
                <button
                  onClick={() => setActive(p)}
                  className="block text-center w-full px-4 py-2.5 rounded-md bg-[var(--color-gold)] text-[var(--color-ink)] text-sm font-medium hover:opacity-90 transition"
                >
                  View
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {active && <Lightbox product={active} onClose={() => setActive(null)} />}
    </>
  );
}
