"use client";

import Image from "next/image";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";
import { useLocale } from "@/context/LocaleContext";

type Props = {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  accent?: string;
};

export default function PageShell({
  children,
  title,
  subtitle,
  accent = "#ed3b6b",
}: Props) {
  const { t } = useLocale();

  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-clip bg-[#121218] text-white">
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(45,45,70,0.55),transparent_55%)]" />
        <div
          className="absolute -left-24 bottom-0 h-[55vh] w-[70vw] max-w-[820px] animate-drift-glow"
          style={{
            background: `radial-gradient(ellipse at bottom left, ${accent}55, rgba(59,130,246,0.25), transparent 70%)`,
          }}
        />
        <div className="absolute right-[-10%] top-[18%] h-[42vh] w-[42vw] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.28),transparent_68%)] blur-2xl" />

        <Image
          src={encodeURI("/logo/Mask group.png")}
          alt=""
          width={900}
          height={500}
          className="absolute w-full h-full -rotate-[18deg] object-contain opacity-45 mix-blend-lighten blur-[0.5px]"
        />

        <span className="absolute right-[-4%] top-[22%] select-none font-display text-[22vw] font-extrabold leading-none tracking-tight text-white/[0.045]">
          NIKE
        </span>

        <div
          className="absolute left-[48%] top-[36%] h-16 w-[38vw] max-w-[420px] -translate-x-1/2 -rotate-[28deg] opacity-80 shadow-[0_20px_60px_rgba(0,0,0,0.35)]"
          style={{
            background: `linear-gradient(90deg, ${accent}, #7c5cff 55%, #3b82f6)`,
          }}
        />
        <div
          className="absolute left-[58%] top-[48%] h-12 w-[30vw] max-w-[340px] -translate-x-1/2 -rotate-[28deg] opacity-70"
          style={{
            background: "linear-gradient(90deg, #8b5cff, #38bdf8)",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto flex w-full max-w-[1200px] flex-1 flex-col">
        <SiteHeader />
        <div className="animate-page-rise flex-1 px-4 pb-14 pt-2 sm:px-6 md:px-10 lg:px-16">
          <div className="mb-10 max-w-2xl">
            <p
              className="mb-3 text-xs font-bold uppercase tracking-[0.28em]"
              style={{ color: accent }}
            >
              {t("common.store")}
            </p>
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              {title}
            </h1>
            <div
              className="mt-4 h-1.5 w-24 -skew-x-[20deg]"
              style={{
                background: `linear-gradient(90deg, ${accent}, #7c5cff)`,
              }}
            />
            {subtitle ? (
              <p className="mt-4 text-base leading-7 text-white/72 sm:text-lg">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="animate-page-rise [animation-delay:120ms]">
            {children}
          </div>
        </div>
      </div>

      <div className="relative z-10 mt-auto w-full">
        <SiteFooter />
      </div>
    </main>
  );
}
