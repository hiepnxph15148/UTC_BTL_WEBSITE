"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/admin", label: "Dashboard", icon: "◆", match: "exact" as const },
  {
    href: "/admin/products",
    label: "All Products",
    icon: "▦",
    match: "products" as const,
  },
  {
    href: "/admin/products/new",
    label: "Create Product",
    icon: "+",
    match: "exact" as const,
  },
  {
    href: "/admin/orders",
    label: "Order List",
    icon: "☰",
    match: "prefix" as const,
  },
  {
    href: "/admin/feedback",
    label: "Góp ý & phản ánh",
    icon: "✉",
    match: "prefix" as const,
  },
  {
    href: "/admin/categories",
    label: "Categories",
    icon: "▣",
    match: "categories" as const,
  },
  {
    href: "/admin/categories/new",
    label: "Create Category",
    icon: "+",
    match: "exact" as const,
  },
] as const;

function isActive(pathname: string, link: (typeof links)[number]) {
  if (link.match === "exact") return pathname === link.href;
  if (link.match === "products") {
    return (
      pathname === "/admin/products" ||
      (pathname.startsWith("/admin/products/") &&
        pathname !== "/admin/products/new")
    );
  }
  if (link.match === "categories") {
    return (
      pathname === "/admin/categories" ||
      (pathname.startsWith("/admin/categories/") &&
        pathname !== "/admin/categories/new")
    );
  }
  return pathname === link.href || pathname.startsWith(`${link.href}/`);
}

export default function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-full flex-col border-b border-white/10 bg-[#16161e] lg:w-60 lg:border-b-0 lg:border-r">
      <div className="flex items-center gap-3 px-5 py-5">
        <Image
          src={encodeURI("/logo/image 1.png")}
          alt="Nike"
          width={72}
          height={28}
          priority
          className="h-6 w-auto mix-blend-lighten"
        />
        <span className="rounded-md bg-[#ed3b6b]/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#ed3b6b]">
          Admin
        </span>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 pb-4 lg:flex-col lg:overflow-visible lg:pb-6">
        {links.map((link) => {
          const active = isActive(pathname, link);

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-colors ${
                active
                  ? "bg-[#ed3b6b] text-white shadow-[0_10px_30px_rgba(237,59,107,0.35)]"
                  : "text-white/65 hover:bg-white/5 hover:text-white"
              }`}
            >
              <span className="text-xs opacity-80">{link.icon}</span>
              {link.label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto hidden border-t border-white/10 p-4 text-xs text-white/40 lg:block">
        Chỉ truy cập qua <span className="text-white/70">/admin</span>
      </div>
    </aside>
  );
}
