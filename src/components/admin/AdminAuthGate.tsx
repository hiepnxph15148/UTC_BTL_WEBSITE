"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLocale } from "@/context/LocaleContext";
import { isAdminUserName } from "@/lib/admin-access";

export default function AdminAuthGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hydrated, isAuthenticated, session } = useAuth();
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const allowed =
    isAuthenticated && isAdminUserName(session?.userName);

  useEffect(() => {
    if (!hydrated) return;

    if (!isAuthenticated) {
      const next =
        pathname && pathname.startsWith("/admin") ? pathname : "/admin";
      router.replace(`/login?next=${encodeURIComponent(next)}`);
      return;
    }

    if (!isAdminUserName(session?.userName)) {
      router.replace("/");
    }
  }, [
    hydrated,
    isAuthenticated,
    session?.userName,
    pathname,
    router,
  ]);

  if (!hydrated || !allowed) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#121218] text-sm text-white/50">
        {!hydrated ? t("admin.authChecking") : t("admin.authRedirecting")}
      </div>
    );
  }

  return <>{children}</>;
}
