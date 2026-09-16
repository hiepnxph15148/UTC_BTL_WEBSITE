"use client";

import Link from "next/link";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useLocale } from "@/context/LocaleContext";
import type { MessageKey } from "@/i18n/messages";

const columns: { title: MessageKey; links: { key: MessageKey; href: string }[] }[] =
  [
    {
      title: "footer.resources",
      links: [
        { key: "footer.giftCards", href: "#" },
        { key: "footer.corporate", href: "#" },
        { key: "footer.findStore", href: "#" },
        { key: "footer.membership", href: "#" },
        { key: "footer.journal", href: "#" },
        { key: "footer.feedback", href: "#" },
      ],
    },
    {
      title: "footer.help",
      links: [
        { key: "footer.getHelp", href: "#" },
        { key: "footer.orderStatus", href: "/orders" },
        { key: "footer.shipping", href: "#" },
        { key: "footer.returns", href: "/returns" },
        { key: "footer.cancel", href: "#" },
        { key: "footer.payment", href: "#" },
        { key: "footer.giftBalance", href: "#" },
        { key: "footer.contactUs", href: "/contact" },
      ],
    },
    {
      title: "footer.company",
      links: [
        { key: "footer.about", href: "#" },
        { key: "footer.news", href: "#" },
        { key: "footer.careers", href: "#" },
        { key: "footer.investors", href: "#" },
        { key: "footer.purpose", href: "#" },
        { key: "footer.sustain", href: "#" },
        { key: "footer.a11y", href: "#" },
      ],
    },
    {
      title: "footer.promos",
      links: [
        { key: "footer.student", href: "/offers" },
        { key: "footer.military", href: "/offers" },
        { key: "footer.teacher", href: "/offers" },
        { key: "footer.firstResponders", href: "/offers" },
        { key: "footer.birthday", href: "/offers" },
      ],
    },
  ];

const legalLinks: MessageKey[] = [
  "footer.guides",
  "footer.termsSale",
  "footer.termsUse",
  "footer.privacy",
  "footer.choices",
  "footer.ca",
];

export default function SiteFooter() {
  const { t } = useLocale();

  return (
    <footer className="mt-auto w-full border-t border-white/10 bg-[#121218] text-white">
      <div className="mx-auto w-full max-w-[1200px] px-4 py-10 sm:px-6 md:px-10 lg:px-16 lg:py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
          {columns.map((column) => (
            <div key={column.title}>
              <h3 className="text-sm font-semibold tracking-wide text-white">
                {t(column.title)}
              </h3>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.key}>
                    <Link
                      href={link.href}
                      className="text-sm text-white/55 transition-colors hover:text-white"
                    >
                      {t(link.key)}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-4 px-4 py-5 text-xs text-white/55 sm:px-6 md:flex-row md:flex-wrap md:items-center md:justify-between md:px-10 lg:px-16">
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <p>{t("footer.rights", { year: new Date().getFullYear() })}</p>
            {legalLinks.map((key) => (
              <Link
                key={key}
                href="#"
                className="inline-flex items-center gap-1 transition-colors hover:text-white"
              >
                {t(key)}
                {key === "footer.guides" ? (
                  <span aria-hidden className="text-[10px]">
                    ▾
                  </span>
                ) : null}
              </Link>
            ))}
          </div>

          <div className="inline-flex items-center gap-3 font-medium text-white">
            <LanguageSwitcher compact />
            <p className="inline-flex items-center gap-2">
              <span aria-hidden className="text-base leading-none">
                🌐
              </span>
              {t("footer.region")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
