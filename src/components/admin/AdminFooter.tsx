"use client";

import { useLocale } from "@/context/LocaleContext";

export default function AdminFooter() {
  const { t } = useLocale();
  return (
    <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-4 text-xs text-white/40 sm:px-6 lg:px-8">
      <p>© {new Date().getFullYear()} — Nike UTC Admin</p>
      <p className="text-white/30">{t("admin.internal")}</p>
    </footer>
  );
}
