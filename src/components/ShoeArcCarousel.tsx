"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef } from "react";
import type { ShoeProduct } from "@/data/shoes";

type Props = {
  shoes: ShoeProduct[];
  activeIndex: number;
  onChange: (index: number) => void;
};

const VIEW_W = 220;
const VIEW_H = 460;
const CX = 268;
const CY = 230;
/** Thumbnail nằm cách thanh cung hơn để khỏi dính knob */
const R_THUMB = 215;
const R_TRACK = 152;
const MAX_ANGLE = 62;
const TRACK_END_ANGLE = 74;

const toRad = (deg: number) => (deg * Math.PI) / 180;

const round = (value: number, digits = 4) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const pointOnArc = (angleDeg: number, radius: number) => ({
  x: round(CX - radius * Math.cos(toRad(angleDeg))),
  y: round(CY + radius * Math.sin(toRad(angleDeg))),
});

const pct = (value: number, total: number) => `${round((value / total) * 100)}%`;

export default function ShoeArcCarousel({
  shoes,
  activeIndex,
  onChange,
}: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  const step = shoes.length > 1 ? (MAX_ANGLE * 2) / (shoes.length - 1) : 0;
  const angleOf = (index: number) => -MAX_ANGLE + index * step;

  const trackStart = pointOnArc(-TRACK_END_ANGLE, R_TRACK);
  const trackEnd = pointOnArc(TRACK_END_ANGLE, R_TRACK);
  const knob = pointOnArc(angleOf(activeIndex), R_TRACK);

  const indexFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const rect = wrapperRef.current?.getBoundingClientRect();
      if (!rect || step === 0) return null;

      const scale = rect.width / VIEW_W;
      const px = (clientX - rect.left) / scale;
      const py = (clientY - rect.top) / scale;
      const angle = (Math.atan2(py - CY, CX - px) * 180) / Math.PI;
      const clamped = Math.max(-MAX_ANGLE, Math.min(MAX_ANGLE, angle));

      return Math.max(
        0,
        Math.min(shoes.length - 1, Math.round((clamped + MAX_ANGLE) / step)),
      );
    },
    [shoes.length, step],
  );

  useEffect(() => {
    const handleMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;
      const next = indexFromPointer(event.clientX, event.clientY);
      if (next !== null && next !== activeIndex) onChange(next);
    };
    const stop = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", stop);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", stop);
    };
  }, [activeIndex, indexFromPointer, onChange]);

  return (
    <div
      ref={wrapperRef}
      className="relative h-[460px] w-[220px] shrink-0 select-none overflow-visible"
    >
      {/* Thanh cung dạng rail / 1 thanh liền */}
      <svg
        viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
        className="pointer-events-none absolute inset-0 h-full w-full"
        fill="none"
      >
        <defs>
          <linearGradient id="arc-rail" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#9a9aa3" />
            <stop offset="45%" stopColor="#c8c8d0" />
            <stop offset="100%" stopColor="#6e6e78" />
          </linearGradient>
        </defs>
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${R_TRACK} ${R_TRACK} 0 0 0 ${trackEnd.x} ${trackEnd.y}`}
          stroke="url(#arc-rail)"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d={`M ${trackStart.x} ${trackStart.y} A ${R_TRACK} ${R_TRACK} 0 0 0 ${trackEnd.x} ${trackEnd.y}`}
          stroke="#5a5a64"
          strokeWidth="3"
          strokeLinecap="round"
          opacity="0.45"
        />
      </svg>

      {/* Knob nằm giữa thanh (cùng bán kính track) */}
      <button
        type="button"
        aria-label="Kéo để đổi mẫu giày"
        onPointerDown={(event) => {
          event.preventDefault();
          draggingRef.current = true;
        }}
        className="absolute z-30 h-[16px] w-[16px] cursor-grab rounded-full bg-white shadow-[0_0_0_3px_rgba(90,90,100,0.35),0_0_12px_rgba(255,255,255,0.55)] transition-all duration-300 active:cursor-grabbing"
        style={{
          left: pct(knob.x, VIEW_W),
          top: pct(knob.y, VIEW_H),
          transform: "translate(-50%, -50%)",
        }}
      />

      {shoes.map((shoe, index) => {
        const angle = angleOf(index);
        const { x, y } = pointOnArc(angle, R_THUMB);
        const isActive = index === activeIndex;
        const cardSize = isActive ? 64 : 56;
        const tilt = round(angle * 0.28, 2);

        return (
          <button
            key={shoe.id}
            type="button"
            aria-label={`Chọn ${shoe.name} ${shoe.nameAccent}`}
            aria-pressed={isActive}
            onClick={() => onChange(index)}
            className="absolute z-10 cursor-pointer overflow-visible transition-all duration-300"
            style={{
              left: pct(x, VIEW_W),
              top: pct(y, VIEW_H),
              width: cardSize,
              height: cardSize,
              transform: `translate(-50%, -50%) rotate(${tilt}deg)`,
            }}
          >
            {/* Nền div — không clip ảnh */}
            <span
              className={`absolute inset-0 rounded-[16px] transition-all duration-300 ${
                isActive ? "shadow-[0_0_26px_rgba(237,59,107,0.5)] ring-2 ring-white" : ""
              }`}
              style={{ backgroundColor: isActive ? shoe.accent : shoe.thumbBg }}
            />

            {/* Ảnh đè lên div, lộ ra ngoài */}
            <span className="absolute left-1/2 top-1/2 z-10 block h-[120%] w-[140%] -translate-x-1/2 -translate-y-1/2">
              <Image
                src={shoe.hero}
                alt=""
                fill
                sizes="100px"
                className="object-contain mix-blend-lighten drop-shadow-[0_6px_12px_rgba(0,0,0,0.45)]"
              />
            </span>
          </button>
        );
      })}
    </div>
  );
}
