"use client";

import Image from "next/image";
import { useState } from "react";
import HeroStage from "@/components/HeroStage";
import ProductPanel from "@/components/ProductPanel";
import ShoeArcCarousel from "@/components/ShoeArcCarousel";
import SiteHeader from "@/components/SiteHeader";
import { homeShoes } from "@/data/shoes";

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <main className="relative min-h-dvh w-full overflow-x-clip bg-[#181820] lg:h-dvh lg:overflow-hidden">
      <div className="relative min-h-dvh overflow-x-clip bg-[#181820] lg:absolute lg:inset-0 lg:overflow-hidden">
        {/* Swirl: ẩn / đẩy xa trên mobile để khỏi đè đáy */}
        <div
          aria-hidden
          className="animate-swirl pointer-events-none absolute left-[-5%] top-[40%] z-0 hidden h-[55%] w-[100%] -rotate-[16deg] lg:block"
        >
          <Image
            src={encodeURI("/logo/Mask group.png")}
            alt=""
            fill
            sizes="120vw"
            className="object-contain object-left mix-blend-lighten"
          />
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute bottom-0 left-0 z-0 h-40 w-[55%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.22),rgba(237,59,107,0.12),transparent_72%)] lg:h-80"
        />

        <div className="relative z-10 flex min-h-dvh flex-col lg:h-full">
          <SiteHeader />

          <div className="relative flex min-h-0 flex-1 flex-col gap-4 px-4 pb-8 pt-1 sm:gap-5 sm:px-6 md:px-10 lg:grid lg:grid-cols-[280px_minmax(0,1fr)_200px] lg:items-center lg:gap-6 lg:px-16 lg:pb-10 lg:pt-0 xl:grid-cols-[300px_minmax(0,1fr)_220px]">
            <div className="relative z-30 order-2 isolate lg:order-1 lg:self-center">
              <ProductPanel shoes={homeShoes} activeIndex={activeIndex} />
            </div>

            <div className="relative z-10 order-1 h-[36vh] min-h-[220px] w-full overflow-hidden sm:h-[40vh] lg:order-2 lg:h-auto lg:min-h-0 lg:self-stretch">
              <HeroStage shoes={homeShoes} activeIndex={activeIndex} />
            </div>

            <div className="relative z-30 order-3 mt-2 flex w-full justify-start overflow-hidden pb-[max(0.5rem,env(safe-area-inset-bottom))] lg:mt-0 lg:justify-end">
              <ShoeArcCarousel
                shoes={homeShoes}
                activeIndex={activeIndex}
                onChange={setActiveIndex}
              />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
