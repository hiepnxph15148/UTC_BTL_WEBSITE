import Image from "next/image";
import Link from "next/link";
import type { ShoeProduct } from "@/data/shoes";

type Props = {
  shoe: ShoeProduct;
  index?: number;
  showCategory?: boolean;
  categoryLabel?: string;
};

export default function ShoeCard({
  shoe,
  index = 0,
  showCategory = false,
  categoryLabel,
}: Props) {
  return (
    <Link
      href={`/product/${shoe.id}`}
      className="page-card group block rounded-2xl"
      style={{ animationDelay: `${index * 70}ms` }}
    >
      <div
        className="relative flex h-52 items-center justify-center overflow-hidden"
        style={{
          background: `radial-gradient(circle at 30% 20%, ${shoe.accent}40, #0a0a12 65%)`,
        }}
      >
        {showCategory && categoryLabel ? (
          <span
            className="absolute left-3 top-3 z-20 rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/90"
            style={{ background: `${shoe.accent}cc` }}
          >
            {categoryLabel}
          </span>
        ) : null}
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-6 left-1/2 z-0 h-12 w-[70%] -translate-x-1/2 -rotate-[28deg] opacity-75"
          style={{
            background: `linear-gradient(90deg, ${shoe.accent}, #6366f1)`,
          }}
        />
        <Image
          src={shoe.hero}
          alt={`${shoe.name} ${shoe.nameAccent}`}
          width={300}
          height={200}
          className="relative z-10 h-auto w-[80%] object-contain drop-shadow-[0_24px_40px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3"
        />
      </div>
      <div className="flex items-end justify-between gap-3 p-5">
        <div>
          <h2 className="font-display text-lg font-bold">
            {shoe.name}{" "}
            <span style={{ color: shoe.accent }}>{shoe.nameAccent}</span>
          </h2>
          <p className="mt-1 text-sm font-semibold text-white/75">{shoe.price}</p>
        </div>
        <span
          className="rounded-md px-3 py-1.5 text-xs font-bold tracking-wide text-white"
          style={{
            background: `linear-gradient(90deg, ${shoe.accent}, #ff6b95)`,
          }}
        >
          View
        </span>
      </div>
    </Link>
  );
}
