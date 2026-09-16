"use client";

import Link from "next/link";
import PageShell from "@/components/PageShell";
import { useLocale } from "@/context/LocaleContext";

export default function NotFound() {
  const { t } = useLocale();
  return (
    <PageShell title={t("product.notFound")} subtitle={t("product.notFoundSub")}>
      <Link
        href="/collections"
        className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
      >
        {t("product.backCollections")}
      </Link>
    </PageShell>
  );
}
