"use client";

import Image from "next/image";
import { useState } from "react";
import HeroStage from "@/components/HeroStage";
import ProductPanel from "@/components/ProductPanel";
import ShoeArcCarousel from "@/components/ShoeArcCarousel";
import SiteHeader from "@/components/SiteHeader";
import { shoes } from "@/data/shoes";

export default function Home() {
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <main className="relative h-dvh w-screen overflow-hidden bg-[#181820]">
      <div className="absolute inset-0 overflow-hidden bg-[#181820]">
        <div
          aria-hidden
          className="animate-swirl pointer-events-none absolute left-[-5%] top-[40%] z-0 h-[55%] w-[100%] -rotate-[16deg]"
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
          className="pointer-events-none absolute bottom-0 left-0 z-0 h-80 w-[55%] bg-[radial-gradient(ellipse_at_bottom_left,rgba(168,85,247,0.3),rgba(237,59,107,0.16),transparent_72%)]"
        />

        <div className="relative z-10 flex h-full flex-col">
          <SiteHeader />

          <div className="relative grid min-h-0 flex-1 grid-cols-1 items-center px-8 pb-10 pt-0 md:px-12 lg:grid-cols-[300px_minmax(0,1fr)_200px] lg:gap-6 lg:px-16">
            <div className="relative z-30 self-center">
              <ProductPanel shoes={shoes} activeIndex={activeIndex} />
            </div>

            <div className="relative z-10 min-h-0 self-stretch overflow-visible">
              <HeroStage shoes={shoes} activeIndex={activeIndex} />
            </div>

            <div className="z-30 mt-6 flex justify-center lg:mt-0 lg:justify-end">
              <ShoeArcCarousel
                shoes={shoes}
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
