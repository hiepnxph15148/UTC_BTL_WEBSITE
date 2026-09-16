"use client";

import Image from "next/image";
import Link from "next/link";
import PageShell from "@/components/PageShell";
import { useLocale } from "@/context/LocaleContext";
import { shoes } from "@/data/shoes";

export default function OffersPage() {
  const { t } = useLocale();
  const offers = [
    {
      id: "flash",
      badge: "-20%",
      title: t("offers.flashTitle"),
      desc: t("offers.flashDesc"),
      shoe: shoes[1],
      glow: "#c8102e",
    },
    {
      id: "bundle",
      badge: "2 for $300",
      title: t("offers.bundleTitle"),
      desc: t("offers.bundleDesc"),
      shoe: shoes[0],
      glow: "#ed3b6b",
    },
    {
      id: "member",
      badge: "Member",
      title: t("offers.memberTitle"),
      desc: t("offers.memberDesc"),
      shoe: shoes[3],
      glow: "#c6e600",
    },
  ];

  return (
    <PageShell
      title={t("offers.title")}
      accent="#ed3b6b"
      subtitle={t("offers.subtitle")}
    >
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer, index) => (
          <article
            key={offer.id}
            className="page-card rounded-2xl"
            style={{ animationDelay: `${index * 90}ms` }}
          >
            <div
              className="relative flex h-48 items-center justify-center overflow-hidden"
              style={{
                background: `linear-gradient(145deg, ${offer.glow}33, #0a0a10 60%)`,
              }}
            >
              <div
                aria-hidden
                className="pointer-events-none absolute -right-6 top-8 z-0 h-14 w-40 -rotate-[28deg] opacity-80"
                style={{
                  background: `linear-gradient(90deg, ${offer.glow}, #7c5cff)`,
                }}
              />
              <span className="absolute left-3 top-3 z-20 rounded-md bg-nike-accent px-3 py-1 text-xs font-bold tracking-wide text-white shadow-lg">
                {offer.badge}
              </span>
              <Image
                src={offer.shoe.hero}
                alt={`${offer.shoe.name} ${offer.shoe.nameAccent}`}
                width={280}
                height={190}
                className="relative z-10 h-auto w-[78%] object-contain drop-shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
              />
            </div>
            <div className="p-5">
              <h2 className="font-display text-xl font-bold">{offer.title}</h2>
              <p className="mt-2 text-sm leading-6 text-white/70">{offer.desc}</p>
              <Link
                href={`/product/${offer.shoe.id}`}
                className="mt-5 inline-flex rounded-lg px-4 py-2.5 text-sm font-bold tracking-wide text-white transition-transform hover:scale-105"
                style={{
                  background: `linear-gradient(90deg, ${offer.glow}, #ff6b95)`,
                }}
              >
                {t("offers.shopNow")}
              </Link>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
