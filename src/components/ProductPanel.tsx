"use client";

import { useEffect, useState } from "react";
import { slideClass } from "@/components/HeroStage";
import type { ShoeProduct } from "@/data/shoes";

type Props = {
  shoes: ShoeProduct[];
  activeIndex: number;
};

export default function ProductPanel({ shoes, activeIndex }: Props) {
  const shoe = shoes[activeIndex];
  const [color, setColor] = useState(0);
  const [size, setSize] = useState(0);

  useEffect(() => {
    setColor(0);
    setSize(0);
  }, [shoe.id]);

  return (
    <div className="flex w-full max-w-full flex-col gap-4 sm:gap-5 lg:w-[300px] lg:gap-7">
      {/* overflow-hidden: chặn chữ/giá translate 115vh tràn xuống đáy trang */}
      <div className="relative h-[88px] overflow-hidden sm:h-[110px] lg:h-[132px]">
        {shoes.map((item, index) => (
          <div key={item.id} className={slideClass(index, activeIndex)}>
            <h1 className="font-display text-[28px] font-extrabold leading-[1.08] tracking-tight sm:text-[32px] lg:text-[36px]">
              {item.name}{" "}
              <span style={{ color: item.accent }}>{item.nameAccent}</span>
            </h1>
            <p className="mt-2 text-lg font-semibold tracking-tight sm:mt-3 sm:text-[20px] lg:text-[22px]">
              {item.price}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-end gap-6 sm:gap-8">
        <div>
          <p className="text-sm font-semibold text-white">Colors</p>
          <div className="mt-2.5 flex items-center gap-3 sm:mt-3.5 sm:gap-3.5">
            {shoe.colors.map((value, index) => (
              <button
                key={`${shoe.id}-${value}`}
                type="button"
                aria-label={`Màu ${index + 1}`}
                aria-pressed={color === index}
                onClick={() => setColor(index)}
                className={`h-[15px] w-[15px] cursor-pointer rounded-full transition-all ${
                  color === index
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#181820]"
                    : "ring-1 ring-white/20 hover:scale-110"
                }`}
                style={{ backgroundColor: value }}
              />
            ))}
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold text-white">Size</p>
          <div className="mt-2.5 flex items-center gap-2.5 sm:mt-3.5 sm:gap-3">
            {shoe.sizes.map((value, index) => (
              <button
                key={value}
                type="button"
                aria-pressed={size === index}
                onClick={() => setSize(index)}
                className={`h-9 w-9 cursor-pointer rounded-full border text-sm font-semibold transition-colors sm:h-10 sm:w-10 ${
                  size === index
                    ? "border-white bg-white text-[#181820]"
                    : "border-white/35 text-white/75 hover:border-white hover:text-white"
                }`}
              >
                {value}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-1 w-full max-w-[168px] cursor-pointer rounded-[10px] py-3 text-sm font-bold tracking-[0.2em] text-white shadow-[0_10px_30px_rgba(237,59,107,0.35)] transition-transform hover:scale-105 active:scale-100 sm:py-3.5"
        style={{
          background: `linear-gradient(90deg, ${shoe.accent}, #ff6b95)`,
        }}
      >
        BUY
      </button>
    </div>
  );
}
