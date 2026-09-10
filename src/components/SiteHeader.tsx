"use client";

import Image from "next/image";
import { useState } from "react";

const navLinks = ["Home", "Offers", "Collections", "Contact"];

export default function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="relative z-50 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-10 md:py-7 lg:gap-6 lg:px-16 lg:py-8">
      <Image
        src={encodeURI("/logo/image 1.png")}
        alt="Nike"
        width={72}
        height={28}
        priority
        className="h-5 w-auto self-center mix-blend-lighten sm:h-6 lg:h-7"
      />

      <nav className="hidden items-center justify-end gap-6 pr-4 text-sm text-white/85 md:flex lg:gap-10 lg:pr-6 lg:text-[15px] xl:pr-10">
        {navLinks.map((link, index) => (
          <a
            key={link}
            href="#"
            className={
              index === 0
                ? "font-semibold text-white"
                : "transition-colors hover:text-white"
            }
          >
            {link}
          </a>
        ))}
      </nav>

      <div className="flex items-center gap-3 justify-self-end sm:gap-4">
        {/* Search + bag: chỉ hiện desktop */}
        <label className="hidden h-10 items-center gap-2 rounded-full bg-nike-surface px-4 md:flex lg:h-11 lg:px-5">
          <Image
            src={encodeURI("/icon/search (2).png")}
            alt=""
            width={16}
            height={16}
            className="h-4 w-4 mix-blend-lighten"
          />
          <input
            type="search"
            placeholder="Search"
            className="w-20 bg-transparent text-sm font-semibold text-white placeholder:text-white/65 focus:outline-none md:w-28 lg:w-36"
          />
        </label>

        <button
          type="button"
          aria-label="Giỏ hàng"
          className="inline-flex cursor-pointer"
        >
          <Image
            src={encodeURI("/icon/bag (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-5 w-5 mix-blend-lighten transition-transform hover:scale-110 sm:h-6 sm:w-6 lg:h-[26px] lg:w-[26px]"
          />
        </button>

        {/* Mobile: menu mở nav */}
        <button
          type="button"
          aria-label={menuOpen ? "Đóng menu" : "Mở menu"}
          aria-expanded={menuOpen}
          className="cursor-pointer md:hidden"
          onClick={() => setMenuOpen((open) => !open)}
        >
          <Image
            src={encodeURI("/icon/menu (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-5 w-5 mix-blend-lighten transition-transform hover:scale-110 sm:h-6 sm:w-6"
          />
        </button>

        {/* Desktop vẫn có menu icon trang trí như Figma */}
        <button
          type="button"
          aria-label="Menu"
          className="hidden cursor-pointer md:inline-flex"
        >
          <Image
            src={encodeURI("/icon/menu (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-6 w-6 mix-blend-lighten transition-transform hover:scale-110 lg:h-[26px] lg:w-[26px]"
          />
        </button>
      </div>

      {menuOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-white/10 bg-[#181820]/95 px-4 py-4 backdrop-blur-md md:hidden">
          <nav className="flex flex-col gap-3">
            {navLinks.map((link, index) => (
              <a
                key={link}
                href="#"
                className={`text-base ${
                  index === 0 ? "font-semibold text-white" : "text-white/75"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link}
              </a>
            ))}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
