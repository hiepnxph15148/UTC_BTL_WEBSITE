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
    <div className="pointer-events-none relative h-full min-h-[440px] w-full overflow-visible">
      <span className="absolute left-[48%] top-[46%] z-0 -translate-x-1/2 -translate-y-1/2 select-none font-display text-[140px] font-extrabold tracking-tight text-white/[0.07] xl:text-[200px]">
        NIKE
      </span>

      {strips.map((strip, stripIndex) => (
        <div
          key={stripIndex}
          className="absolute z-20"
          style={{ left: strip.left, top: strip.top }}
        >
          {/* Thanh parallelogram giữ nguyên style */}
          <div
            className="absolute left-1/2 top-1/2 shadow-[0_12px_28px_rgba(0,0,0,0.4)]"
            style={{
              width: BAR_W,
              height: BAR_H,
              background: strip.gradient,
              transform: `translate(-50%, -50%) skewX(${BAR_SKEW}deg)`,
            }}
          />

          {/* Ảnh đè giữa thanh — dịch vào trong div 10px */}
          <div
            className="absolute left-1/2 top-1/2 z-10"
            style={{
              width: 180,
              height: 130,
              transform: "translate(calc(-50% - 10px), -50%)",
            }}
          >
            {shoes.map((shoe, index) => (
              <div key={shoe.id} className={slideClass(index, activeIndex)}>
                <Image
                  src={shoe.angles[stripIndex]}
                  alt=""
                  fill
                  sizes="180px"
                  className="object-contain object-center mix-blend-lighten drop-shadow-[0_8px_20px_rgba(0,0,0,0.5)]"
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Giày chính: nghiêng sâu hơn + lệch trái cho cân */}
      <div className="absolute left-[32%] top-[40%] z-30 h-[min(138%,864px)] w-[min(150%,1200px)] -translate-x-1/2 -translate-y-1/2">
        {shoes.map((shoe, index) => (
          <div key={shoe.id} className={slideClass(index, activeIndex)}>
            <div className="animate-float-shoe relative h-full w-full">
              <Image
                src={shoe.hero}
                alt={`${shoe.name} ${shoe.nameAccent}`}
                fill
                sizes="(max-width: 1024px) 95vw, 1200px"
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
