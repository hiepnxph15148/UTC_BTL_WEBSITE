"use client";

import Link from "next/link";
import { notFound, useParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import ShoeCard from "@/components/ShoeCard";
import {
  categorySections,
  type ShoeCategory,
} from "@/data/shoes";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

const validIds = new Set(categorySections.map((c) => c.id));

export default function CategoryCollectionPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;

  if (!validIds.has(category as ShoeCategory)) notFound();

  const cat = categorySections.find((c) => c.id === category)!;
  const { shoes, loading, error } = useCatalogProducts({ take: 100 });
  const list = shoes.filter((shoe) => shoe.category === cat.id);

  return (
    <PageShell
      title={cat.label}
      accent={cat.accent}
      subtitle={`${cat.blurb} · ${list.length} sản phẩm`}
    >
      {loading ? (
        <p className="mb-4 text-sm text-white/50">Đang tải…</p>
      ) : null}
      {error ? <p className="mb-4 text-sm text-amber-200/80">{error}</p> : null}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/collections"
          className="text-sm font-semibold text-white/65 transition-colors hover:text-white"
        >
          ← Back to Collections
        </Link>
        <nav className="flex flex-wrap gap-2">
          {categorySections.map((item) => {
            const active = item.id === cat.id;
            return (
              <Link
                key={item.id}
                href={`/collections/${item.id}`}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors"
                style={{
                  borderColor: active ? item.accent : "rgba(255,255,255,0.15)",
                  background: active ? `${item.accent}33` : "transparent",
                  color: active ? "#fff" : "rgba(255,255,255,0.65)",
                }}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((shoe, index) => (
          <ShoeCard key={shoe.id} shoe={shoe} index={index} />
        ))}
      </div>
    </PageShell>
  );
}
