"use client";

import { useEffect, useState } from "react";
import { useLocale } from "@/context/LocaleContext";
import { defaultLocale } from "@/i18n/messages";

type Props = {
  compact?: boolean;
};

function FlagVi({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="24" fill="#DA251D" rx="2" />
      <polygon
        fill="#FF0"
        points="18,4.2 19.8,9.6 25.5,9.6 20.9,12.9 22.7,18.3 18,15 13.3,18.3 15.1,12.9 10.5,9.6 16.2,9.6"
      />
    </svg>
  );
}

function FlagEn({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 36 24"
      className={className}
      aria-hidden
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="36" height="24" fill="#012169" rx="2" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#fff" strokeWidth="4" />
      <path d="M0 0 L36 24 M36 0 L0 24" stroke="#C8102E" strokeWidth="2" />
      <path d="M18 0 V24 M0 12 H36" stroke="#fff" strokeWidth="7" />
      <path d="M18 0 V24 M0 12 H36" stroke="#C8102E" strokeWidth="4" />
    </svg>
  );
}

export default function LanguageSwitcher({ compact = false }: Props) {
  const { locale, setLocale, t } = useLocale();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Giữ cờ mặc định đến khi mount xong → tránh lệch SSR/hydrate.
  const shown = mounted ? locale : defaultLocale;
  const next = shown === "vi" ? "en" : "vi";
  const Flag = shown === "vi" ? FlagVi : FlagEn;
  const label =
    shown === "vi"
      ? `${t("lang.switch")}: ${t("lang.en")}`
      : `${t("lang.switch")}: ${t("lang.vi")}`;

  return (
    <button
      type="button"
      onClick={() => setLocale(next)}
      aria-label={label}
      title={label}
      suppressHydrationWarning
      className="inline-flex cursor-pointer items-center justify-center rounded-md p-0.5 transition-transform hover:scale-110 active:scale-95"
    >
      <Flag className={compact ? "h-4 w-6" : "h-5 w-7"} />
    </button>
  );
}
