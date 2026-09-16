"use client";

import { useLocale } from "@/context/LocaleContext";
import type { Locale } from "@/i18n/messages";

type Props = {
  compact?: boolean;
};

export default function LanguageSwitcher({ compact = false }: Props) {
  const { locale, setLocale, t } = useLocale();

  const btn = (code: Locale, label: string) => {
    const active = locale === code;
    return (
      <button
        type="button"
        onClick={() => setLocale(code)}
        aria-pressed={active}
        className={`cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-bold tracking-wide transition-colors ${
          active
            ? "bg-white text-[#181820]"
            : "text-white/60 hover:text-white"
        }`}
      >
        {label}
      </button>
    );
  };

  return (
    <div
      role="group"
      aria-label={t("lang.switch")}
      className={`inline-flex items-center rounded-full border border-white/15 bg-white/[0.04] p-0.5 ${
        compact ? "" : "shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)]"
      }`}
    >
      {btn("vi", t("lang.vi"))}
      {btn("en", t("lang.en"))}
    </div>
  );
}
