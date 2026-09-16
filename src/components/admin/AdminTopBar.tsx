"use client";

import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/context/LocaleContext";

export default function AdminTopBar() {
  const { t } = useLocale();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
      <div>
        <p className="text-xs uppercase tracking-[0.22em] text-white/40">
          {t("common.store")}
        </p>
        <p className="text-sm text-white/65">
          {t("admin.dash")} / <span className="text-white">Admin</span>
        </p>
      </div>
      <div className="flex items-center gap-3">
        <LanguageSwitcher compact />
        <a
          href="/"
          className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 hover:text-white sm:inline"
        >
          {t("admin.home")}
        </a>
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ed3b6b]/20 text-sm font-bold text-[#ed3b6b]">
          A
        </div>
        <span className="text-sm font-semibold">ADMIN</span>
      </div>
    </header>
  );
}
