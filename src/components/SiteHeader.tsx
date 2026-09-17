"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  FormEvent,
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { useLocale } from "@/context/LocaleContext";
import { storeApi, type NotificationDto } from "@/lib/api";
import type { MessageKey } from "@/i18n/messages";

const navLinks: { key: MessageKey; href: string }[] = [
  { key: "nav.home", href: "/" },
  { key: "nav.offers", href: "/offers" },
  { key: "nav.collections", href: "/collections" },
  { key: "nav.orders", href: "/orders" },
  { key: "nav.returns", href: "/returns" },
  { key: "nav.contact", href: "/contact" },
];

function HeaderSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t } = useLocale();
  const [query, setQuery] = useState(searchParams.get("q") || "");

  useEffect(() => {
    setQuery(searchParams.get("q") || "");
  }, [searchParams]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <form
      onSubmit={onSubmit}
      className="hidden h-10 items-center gap-2 rounded-full bg-nike-surface px-3 lg:flex lg:h-11 lg:px-4"
      role="search"
    >
      <button type="submit" aria-label={t("nav.search")} className="shrink-0">
        <Image
          src={encodeURI("/icon/search (2).png")}
          alt=""
          width={16}
          height={16}
          className="h-4 w-4 mix-blend-lighten"
        />
      </button>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("nav.search")}
        className="w-24 bg-transparent text-sm font-semibold text-white placeholder:text-white/65 focus:outline-none xl:w-32"
      />
    </form>
  );
}

export default function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { count, hydrated } = useCart();
  const { isAuthenticated, hydrated: authHydrated, logout, session } = useAuth();
  const { t, dateLocale } = useLocale();
  const [menuOpen, setMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileQuery, setMobileQuery] = useState("");
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const notifRef = useRef<HTMLDivElement>(null);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  const isAdminUser =
    session?.userName?.toLowerCase() === "admin" ||
    session?.userName?.toLowerCase() === "store-manager";

  const loadNotifications = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      return;
    }
    try {
      setNotifications(await storeApi.getNotifications({ take: 20 }));
    } catch {
      setNotifications([]);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (!authHydrated || !isAuthenticated) return;
    void loadNotifications();
  }, [authHydrated, isAuthenticated, loadNotifications]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (!notifRef.current?.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [notifOpen]);

  const unread = notifications.filter((n) => !n.isRead).length;

  const markRead = async (n: NotificationDto) => {
    if (!n.isRead) {
      try {
        await storeApi.markNotificationRead(n.id);
        setNotifications((prev) =>
          prev.map((x) => (x.id === n.id ? { ...x, isRead: true } : x)),
        );
      } catch {
        // ignore
      }
    }
    setNotifOpen(false);
  };

  return (
    <header className="relative z-50 flex shrink-0 items-center gap-3 px-4 py-4 sm:gap-4 sm:px-6 sm:py-5 md:px-8 md:py-6 lg:gap-8 lg:px-12 lg:py-7 xl:gap-10 xl:px-16">
      <Link
        href="/"
        aria-label={t("nav.homeAria")}
        className="shrink-0"
        onClick={() => setMenuOpen(false)}
      >
        <Image
          src={encodeURI("/logo/image 1.png")}
          alt="Nike"
          width={72}
          height={28}
          priority
          className="h-5 w-auto self-center mix-blend-lighten sm:h-6 lg:h-7"
        />
      </Link>

      <nav className="ml-2 mr-6 hidden min-w-0 flex-1 items-center justify-start gap-x-6 overflow-x-auto whitespace-nowrap text-sm tracking-wide text-white/85 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex xl:ml-4 xl:mr-8 xl:gap-x-8 [&::-webkit-scrollbar]:hidden">
        {navLinks.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={
              isActive(link.href)
                ? "shrink-0 font-semibold text-white"
                : "shrink-0 transition-colors hover:text-white"
            }
          >
            {t(link.key)}
          </Link>
        ))}
      </nav>

      <div className="flex shrink-0 items-center gap-3.5 sm:gap-4 lg:gap-5">
        <Suspense
          fallback={
            <div className="hidden h-10 w-36 rounded-full bg-nike-surface lg:block lg:h-11" />
          }
        >
          <HeaderSearch />
        </Suspense>

        {authHydrated && isAuthenticated ? (
          <div className="relative hidden lg:block" ref={notifRef}>
            <button
              type="button"
              aria-label={t("nav.notifications")}
              onClick={() => {
                setNotifOpen((o) => !o);
                void loadNotifications();
              }}
              className="relative inline-flex text-white/80 hover:text-white"
            >
              <span className="text-lg leading-none">🔔</span>
              {unread > 0 ? (
                <span className="absolute -right-2 -top-2 grid min-h-4 min-w-4 place-items-center rounded-full bg-nike-accent px-1 text-[9px] font-bold text-white">
                  {unread > 9 ? "9+" : unread}
                </span>
              ) : null}
            </button>
            {notifOpen ? (
              <div className="absolute right-0 top-full z-50 mt-2 w-80 max-w-[90vw] rounded-xl border border-white/10 bg-[#1a1a22] p-2 shadow-xl">
                <p className="px-2 py-1 text-xs font-bold uppercase tracking-wide text-white/40">
                  {t("nav.notifications")}
                </p>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <li key={n.id}>
                      {n.orderId ? (
                        <Link
                          href={`/orders/${n.orderId}`}
                          onClick={() => void markRead(n)}
                          className={`block rounded-lg px-3 py-2 text-sm hover:bg-white/5 ${
                            n.isRead ? "text-white/50" : "text-white"
                          }`}
                        >
                          <p>{n.message || t("nav.notifOrder")}</p>
                          <p className="mt-0.5 text-[11px] text-white/35">
                            {n.at ? new Date(n.at).toLocaleString(dateLocale) : ""}
                          </p>
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={() => void markRead(n)}
                          className={`block w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5 ${
                            n.isRead ? "text-white/50" : "text-white"
                          }`}
                        >
                          <p>{n.message || t("nav.notifGeneric")}</p>
                          <p className="mt-0.5 text-[11px] text-white/35">
                            {n.at ? new Date(n.at).toLocaleString(dateLocale) : ""}
                          </p>
                        </button>
                      )}
                    </li>
                  ))}
                  {!notifications.length ? (
                    <li className="px-3 py-6 text-center text-sm text-white/45">
                      {t("nav.notifEmpty")}
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </div>
        ) : null}

        {authHydrated && isAuthenticated ? (
          <div className="hidden items-center gap-3 lg:flex">
            {isAdminUser ? (
              <Link
                href="/admin"
                className="whitespace-nowrap text-xs font-semibold text-nike-accent hover:brightness-110"
              >
                {t("nav.dashboard")}
              </Link>
            ) : null}
            <Link
              href="/account"
              className="whitespace-nowrap text-xs font-semibold text-white/70 hover:text-white"
            >
              {t("nav.account")}
            </Link>
            <button
              type="button"
              onClick={logout}
              className="cursor-pointer whitespace-nowrap text-xs font-semibold text-white/70 hover:text-white"
              title={session?.userName}
            >
              {t("nav.logout")}
            </button>
          </div>
        ) : authHydrated ? (
          <Link
            href="/login"
            className="hidden whitespace-nowrap text-xs font-semibold text-white/70 hover:text-white lg:inline"
          >
            {t("nav.login")}
          </Link>
        ) : null}

        <Link
          href="/cart"
          aria-label={
            hydrated && count > 0
              ? t("nav.cartAriaCount", { count })
              : t("nav.cartAria")
          }
          className="relative inline-flex shrink-0 cursor-pointer"
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
          aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          aria-expanded={menuOpen}
          className="shrink-0 cursor-pointer lg:hidden"
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

        <LanguageSwitcher compact />
      </div>

      {menuOpen ? (
        <div className="absolute inset-x-0 top-full border-b border-white/10 bg-[#181820]/95 px-4 py-4 backdrop-blur-md lg:hidden">
          <form
            className="mb-4 flex items-center gap-2 rounded-full bg-nike-surface px-4 py-2.5"
            onSubmit={(e) => {
              e.preventDefault();
              const q = mobileQuery.trim();
              setMenuOpen(false);
              if (!q) {
                router.push("/search");
                return;
              }
              router.push(`/search?q=${encodeURIComponent(q)}`);
            }}
          >
            <Image
              src={encodeURI("/icon/search (2).png")}
              alt=""
              width={16}
              height={16}
              className="h-4 w-4 mix-blend-lighten"
            />
            <input
              type="search"
              value={mobileQuery}
              onChange={(e) => setMobileQuery(e.target.value)}
              placeholder={t("nav.search")}
              className="w-full bg-transparent text-sm font-semibold text-white placeholder:text-white/65 focus:outline-none"
            />
          </form>
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
                {t(link.key)}
              </Link>
            ))}
            <Link
              href="/cart"
              className="text-base text-white/75"
              onClick={() => setMenuOpen(false)}
            >
              {t("nav.cart")} {hydrated && count > 0 ? `(${count})` : ""}
            </Link>
            {authHydrated ? (
              isAuthenticated ? (
                <>
                  {isAdminUser ? (
                    <Link
                      href="/admin"
                      className="text-base text-nike-accent"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t("nav.dashboard")}
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => {
                      setMenuOpen(false);
                      logout();
                    }}
                    className="text-left text-base text-white/75"
                  >
                    {t("nav.logout")}
                  </button>
                </>
              ) : (
                <Link
                  href="/login"
                  className="text-base text-white/75"
                  onClick={() => setMenuOpen(false)}
                >
                  {t("nav.login")}
                </Link>
              )
            ) : null}
          </nav>
        </div>
      ) : null}
    </header>
  );
}
