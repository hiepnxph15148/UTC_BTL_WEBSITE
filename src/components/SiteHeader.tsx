"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "Offers", href: "/offers" },
  { label: "Collections", href: "/collections" },
  { label: "Contact", href: "/contact" },
] as const;

export default function SiteHeader() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const { isAuthenticated, hydrated: authHydrated, logout, session } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header className="relative z-50 grid shrink-0 grid-cols-[auto_1fr_auto] items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-10 md:py-7 lg:gap-6 lg:px-16 lg:py-8">
      <Link href="/" aria-label="Về trang chủ" onClick={() => setMenuOpen(false)}>
        <Image
          src={encodeURI("/logo/image 1.png")}
          alt="Nike"
          width={72}
          height={28}
          priority
          className="h-5 w-auto self-center mix-blend-lighten sm:h-6 lg:h-7"
        />
      </Link>

      <nav className="hidden items-center justify-end gap-6 pr-4 text-sm text-white/85 md:flex lg:gap-10 lg:pr-6 lg:text-[15px] xl:pr-10">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive(link.href)
                ? "font-semibold text-white"
                : "transition-colors hover:text-white"
            }
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-3 justify-self-end sm:gap-4">
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

        {authHydrated ? (
          isAuthenticated ? (
            <div className="hidden items-center gap-3 md:flex">
              {session?.userName?.toLowerCase() === "admin" ||
              session?.userName?.toLowerCase() === "store-manager" ? (
                <Link
                  href="/admin"
                  className="text-xs font-semibold text-nike-accent hover:brightness-110"
                >
                  Dashboard
                </Link>
              ) : null}
              <button
                type="button"
                onClick={logout}
                className="text-xs font-semibold text-white/70 hover:text-white"
                title={session?.userName}
              >
                Logout
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="hidden text-xs font-semibold text-white/70 hover:text-white md:inline"
            >
              Login
            </Link>
          )
        ) : null}

        <Link
          href="/cart"
          aria-label={`Giỏ hàng${hydrated && count > 0 ? `, ${count} sản phẩm` : ""}`}
          className="relative inline-flex cursor-pointer"
          onClick={() => setMenuOpen(false)}
        >
          <Image
            src={encodeURI("/icon/bag (2).png")}
            alt=""
            width={26}
            height={26}
            className="h-5 w-5 mix-blend-lighten transition-transform hover:scale-110 sm:h-6 sm:w-6 lg:h-[26px] lg:w-[26px]"
          />
          {hydrated && count > 0 ? (
            <span className="absolute -right-2 -top-2 grid min-h-5 min-w-5 place-items-center rounded-full bg-nike-accent px-1 text-[10px] font-bold leading-none text-white shadow-[0_0_12px_rgba(237,59,107,0.55)]">
              {count > 99 ? "99+" : count}
            </span>
          ) : null}
        </Link>

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

        <button
          type="button"
          aria-label="Menu"
          className="hidden cursor-pointer md:inline-flex"
          onClick={() => setMenuOpen((open) => !open)}
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
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-base ${
                  isActive(link.href)
                    ? "font-semibold text-white"
                    : "text-white/75"
                }`}
                onClick={() => setMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/cart"
              className="text-base text-white/75"
              onClick={() => setMenuOpen(false)}
            >
              Cart {hydrated && count > 0 ? `(${count})` : ""}
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
