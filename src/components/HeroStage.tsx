import Image from "next/image";
import type { ShoeProduct } from "@/data/shoes";

type Props = {
  shoes: ShoeProduct[];
  activeIndex: number;
};

/** Thanh parallelogram — ảnh giày đè giữa thanh. */
const strips = [
  {
    left: "65%",
    top: "48%",
    gradient: "linear-gradient(90deg, #ff4d8d 0%, #b06bff 45%, #8b9bff 100%)",
  },
  {
    left: "57%",
    top: "63%",
    gradient: "linear-gradient(90deg, #8b5cff 0%, #3b82f6 100%)",
  },
  {
    left: "49%",
    top: "78%",
    gradient: "linear-gradient(90deg, #ff7a52 0%, #ffc2cf 100%)",
  },
];

const BAR_W = 105;
const BAR_H = 100;
const BAR_SKEW = -40;

export const slideClass = (index: number, activeIndex: number) => {
  const base = "shoe-slide absolute inset-0";
  if (index === activeIndex) return `${base} shoe-slide-active`;
  return index < activeIndex
    ? `${base} shoe-slide-exit`
    : `${base} shoe-slide-enter`;
};

export default function HeroStage({ shoes, activeIndex }: Props) {
  return (
    <div className="pointer-events-none relative h-full min-h-[220px] w-full overflow-hidden sm:min-h-[280px] lg:min-h-[440px]">
      <span className="absolute left-[50%] top-[48%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[72px] font-extrabold tracking-tight text-white/[0.07] sm:text-[100px] lg:left-[48%] lg:top-[46%] lg:text-[140px] xl:text-[200px]">
        NIKE
      </span>

      <div className="pointer-events-none absolute inset-0 hidden sm:block">
        {strips.map((strip, stripIndex) => (
          <div
            key={stripIndex}
            className="absolute z-20 scale-[0.55] sm:scale-[0.7] lg:scale-100"
            style={{ left: strip.left, top: strip.top }}
          >
            {/* Thanh nền — luôn hiện */}
            <div
              className="absolute left-1/2 top-1/2 shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
              style={{
                width: BAR_W,
                height: BAR_H,
                background: strip.gradient,
                transform: `translate(-50%, -50%) skewX(${BAR_SKEW}deg)`,
              }}
            />

            {/* Clip slide — ảnh active vẫn đè lên thanh; slide cũ/mới không tràn PC */}
            <div
              className="absolute left-1/2 top-1/2 z-10 overflow-hidden"
              style={{
                width: 200,
                height: 150,
                transform: "translate(calc(-50% - 10px), -50%)",
              }}
            >
              {shoes.map((shoe, index) => (
                <div key={shoe.id} className={slideClass(index, activeIndex)}>
                  <Image
                    src={shoe.angles[stripIndex]}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-contain object-center mix-blend-lighten drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Giày chính — overflow-hidden để slide không vỡ layout PC */}
      <div className="absolute left-1/2 top-[46%] z-30 h-[min(95%,320px)] w-[min(110%,360px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden sm:left-[42%] sm:h-[min(110%,420px)] sm:w-[min(120%,520px)] lg:left-[36%] lg:top-[42%] lg:h-[min(120%,720px)] lg:w-[min(130%,980px)]">
        {shoes.map((shoe, index) => (
          <div key={shoe.id} className={slideClass(index, activeIndex)}>
            <div className="animate-float-shoe relative h-full w-full">
              <Image
                src={shoe.hero}
                alt={`${shoe.name} ${shoe.nameAccent}`}
                fill
                sizes="(max-width: 640px) 90vw, (max-width: 1024px) 70vw, 980px"
                priority={index === 0}
                className="object-contain mix-blend-lighten drop-shadow-[0_50px_70px_rgba(0,0,0,0.65)]"
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
