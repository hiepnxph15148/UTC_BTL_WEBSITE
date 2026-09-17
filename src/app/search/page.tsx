"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "@/components/PageShell";
import ShoeCard from "@/components/ShoeCard";
import { useLocale } from "@/context/LocaleContext";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";

function SearchResults() {
  const params = useSearchParams();
  const q = (params.get("q") || "").trim();
  const { t } = useLocale();
  const { shoes, loading } = useCatalogProducts({
    search: q || undefined,
    take: 100,
  });

  return (
    <PageShell
      title={t("search.title")}
      accent="#3b82f6"
      subtitle={q ? t("search.subtitle", { q }) : t("search.prompt")}
    >
      {loading ? (
        <p className="mb-6 text-sm text-white/50">{t("common.loading")}</p>
      ) : null}

      {!q ? (
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{t("search.prompt")}</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("search.viewCollections")}
          </Link>
        </div>
      ) : shoes.length === 0 ? (
        <div className="page-card rounded-2xl p-8 text-center">
          <p className="text-white/65">{t("search.empty")}</p>
          <Link
            href="/collections"
            className="mt-5 inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
          >
            {t("search.viewCollections")}
          </Link>
        </div>
      ) : (
        <>
          <p className="mb-5 text-sm text-white/55">
            {t("search.count", { count: shoes.length })}
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {shoes.map((shoe, index) => (
              <ShoeCard key={shoe.id} shoe={shoe} index={index} />
            ))}
          </div>
        </>
      )}
    </PageShell>
  );
}

function SearchFallback() {
  const { t } = useLocale();
  return (
    <PageShell title={t("search.title")} subtitle={t("common.loading")}>
      <p className="text-white/60">{t("common.loading")}</p>
    </PageShell>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchFallback />}>
      <SearchResults />
    </Suspense>
  );
}
