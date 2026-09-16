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
import { useLocale } from "@/context/LocaleContext";
import { categoryBlurbKey, categoryLabelKey } from "@/i18n/messages";

const validIds = new Set(categorySections.map((c) => c.id));

export default function CategoryCollectionPage() {
  const params = useParams<{ category: string }>();
  const category = params.category;
  const { t } = useLocale();
  const { shoes, loading } = useCatalogProducts({ take: 100 });

  if (!validIds.has(category as ShoeCategory)) notFound();

  const cat = categorySections.find((c) => c.id === category)!;
  const list = shoes.filter((shoe) => shoe.category === cat.id);

  return (
    <PageShell
      title={t(categoryLabelKey(cat.id))}
      accent={cat.accent}
      subtitle={`${t(categoryBlurbKey(cat.id))} · ${t("collections.count", { count: list.length })}`}
    >
      {loading ? (
        <p className="mb-4 text-sm text-white/50">{t("common.loading")}</p>
      ) : null}

      <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/collections"
          className="text-sm font-semibold text-white/65 transition-colors hover:text-white"
        >
          {t("collections.back")}
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
                {t(categoryLabelKey(item.id))}
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
