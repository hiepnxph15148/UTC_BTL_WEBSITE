import "./admin.css";
import { AdminProvider } from "@/context/AdminContext";
import AdminFooter from "@/components/admin/AdminFooter";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminTopBar from "@/components/admin/AdminTopBar";

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
            <AdminTopBar />
            <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
            <AdminFooter />
          </div>
        </div>
      </div>
    </AdminProvider>
  );
}
