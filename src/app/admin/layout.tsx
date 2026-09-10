import "./admin.css";
import { AdminProvider } from "@/context/AdminContext";
import AdminSidebar from "@/components/admin/AdminSidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminProvider>
      <div className="admin-shell min-h-dvh bg-[#121218] text-white">
        <div className="mx-auto flex min-h-dvh max-w-[1440px] flex-col lg:flex-row">
          <AdminSidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <header className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-4 sm:px-6 lg:px-8">
              <div>
                <p className="text-xs uppercase tracking-[0.22em] text-white/40">
                  Nike Store
                </p>
                <p className="text-sm text-white/65">
                  Dashboard / <span className="text-white">Admin</span>
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/55 sm:inline">
                  Không hiện link ngoài store
                </span>
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#ed3b6b]/20 text-sm font-bold text-[#ed3b6b]">
                  A
                </div>
                <span className="text-sm font-semibold">ADMIN</span>
              </div>
            </header>
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-4 text-xs text-white/40 sm:px-6 lg:px-8">
              <p>© {new Date().getFullYear()} — Nike UTC Admin</p>
              <p className="text-white/30">/admin · nội bộ</p>
            </footer>
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
