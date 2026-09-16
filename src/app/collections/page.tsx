"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import ShoeCard from "@/components/ShoeCard";
import { categorySections, type ShoeCategory } from "@/data/shoes";
import { useCatalogProducts } from "@/hooks/useCatalogProducts";
import { useLocale } from "@/context/LocaleContext";
import { categoryBlurbKey, categoryLabelKey } from "@/i18n/messages";

const PREVIEW = 3;

export default function CollectionsPage() {
  const { shoes, loading } = useCatalogProducts({ take: 100 });
  const { t } = useLocale();

  return (
    <PageShell
      title={t("collections.title")}
      accent="#3b82f6"
      subtitle={t("collections.subtitle")}
    >
      {loading ? (
        <p className="mb-6 text-sm text-white/50">{t("common.loading")}</p>
      ) : null}

      <nav className="mb-10 flex flex-wrap gap-2.5">
        {categorySections.map((cat) => (
          <a
            key={cat.id}
            href={`#${cat.id}`}
            className="rounded-full border border-white/15 bg-white/[0.04] px-4 py-2 text-sm font-semibold text-white/75 transition-colors hover:border-white/35 hover:text-white"
            style={{ boxShadow: `inset 0 -2px 0 ${cat.accent}66` }}
          >
            {t(categoryLabelKey(cat.id))}
          </a>
        ))}
      </nav>

      <div className="space-y-14">
        {categorySections.map((cat) => {
          const all = shoes.filter(
            (shoe) => shoe.category === (cat.id as ShoeCategory),
          );
          const preview = all.slice(0, PREVIEW);
          const hasMore = all.length > PREVIEW;

          return (
            <section key={cat.id} id={cat.id} className="scroll-mt-24">
              <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-3">
                    <span
                      className="h-2 w-8 -skew-x-[20deg]"
                      style={{ background: cat.accent }}
                    />
                    <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
                      {t(categoryLabelKey(cat.id))}
                    </h2>
                  </div>
                  <p className="text-sm text-white/60">
                    {t(categoryBlurbKey(cat.id))}
                    {" · "}
                    {t("collections.count", { count: all.length })}
                  </p>
                </div>

                <Link
                  href={`/collections/${cat.id}`}
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold tracking-wide text-white transition-transform hover:scale-[1.02]"
                  style={{
                    background: `linear-gradient(90deg, ${cat.accent}, #6366f1)`,
                  }}
                >
                  {t("collections.showAll")}
                  <span aria-hidden>→</span>
                </Link>
              </div>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {preview.map((shoe, index) => (
                  <ShoeCard key={shoe.id} shoe={shoe} index={index} />
                ))}
              </div>

              {hasMore ? (
                <p className="mt-4 text-center text-sm text-white/50 sm:text-left">
                  {t("collections.more", { count: all.length - PREVIEW })}{" "}
                  <Link
                    href={`/collections/${cat.id}`}
                    className="font-semibold underline-offset-2 hover:underline"
                    style={{ color: cat.accent }}
                  >
                    {t("collections.seeAll")}
                  </Link>
                </p>
              ) : null}
            </section>
          );
        })}
      </div>
    </PageShell>
  );
}
