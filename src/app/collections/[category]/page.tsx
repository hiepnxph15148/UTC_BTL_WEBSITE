import Link from "next/link";
import { notFound } from "next/navigation";
import PageShell from "@/components/PageShell";
import ShoeCard from "@/components/ShoeCard";
import {
  categorySections,
  getShoesByCategory,
  type ShoeCategory,
} from "@/data/shoes";

type Props = {
  params: Promise<{ category: string }>;
};

const validIds = new Set(categorySections.map((c) => c.id));

export function generateStaticParams() {
  return categorySections.map((c) => ({ category: c.id }));
}

export default async function CategoryCollectionPage({ params }: Props) {
  const { category } = await params;

  if (!validIds.has(category as ShoeCategory)) notFound();

  const cat = categorySections.find((c) => c.id === category)!;
  const list = getShoesByCategory(cat.id);

  return (
    <PageShell
      title={cat.label}
      accent={cat.accent}
      subtitle={`${cat.blurb} · ${list.length} sản phẩm`}
    >
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
