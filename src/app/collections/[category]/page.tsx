"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import ShoeCard from "@/components/ShoeCard";
import {
  buildCollectionSections,
  resolveCollectionCategory,
  useCatalogProducts,
} from "@/hooks/useCatalogProducts";
import { useLocale } from "@/context/LocaleContext";
import { categoryLabelKey } from "@/i18n/messages";

export default function CategoryCollectionPage() {
  const params = useParams<{ category: string }>();
  const categoryParam = params.category;
  const { t } = useLocale();
  const { shoes, lookups, loading, fromApi } = useCatalogProducts({
    allPages: true,
  });

  const sections = buildCollectionSections(lookups, shoes);
  const cat =
    resolveCollectionCategory(categoryParam, sections, lookups) ||
    sections.find((s) => s.id === categoryParam) ||
    null;

  if (!loading && !cat) {
    return (
      <PageShell title={t("collections.title")} accent="#3b82f6">
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{t("product.notFound")}</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("collections.back")}
          </Link>
        </div>
      </PageShell>
    );
  }

  const active = cat;
  const list = active
    ? shoes.filter((shoe) =>
        active.categoryId
          ? shoe.categoryId === active.categoryId
          : shoe.category === active.id,
      )
    : [];

  const labelFor = (section: { id: string; label: string }) => {
    if (fromApi) return section.label;
    const key = categoryLabelKey(section.id);
    return key === "cat.all" ? section.label : t(key);
  };

  return (
    <PageShell
      title={active ? labelFor(active) : t("common.loading")}
      accent={active?.accent || "#3b82f6"}
      subtitle={
        active
          ? t("collections.count", { count: list.length })
          : t("common.loading")
      }
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
          {sections.map((item) => {
            const isActive = item.id === active?.id;
            return (
              <Link
                key={item.categoryId || item.id}
                href={`/collections/${item.id}`}
                className="rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wide transition-colors"
                style={{
                  borderColor: isActive ? item.accent : "rgba(255,255,255,0.15)",
                  background: isActive ? `${item.accent}33` : "transparent",
                  color: isActive ? "#fff" : "rgba(255,255,255,0.65)",
                }}
              >
                {labelFor(item)}
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

      {!loading && !list.length ? (
        <p className="mt-6 text-center text-sm text-white/50">{t("home.empty")}</p>
      ) : null}
    </PageShell>
  );
}
