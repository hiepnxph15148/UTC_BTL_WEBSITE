import Link from "next/link";
import PageShell from "@/components/PageShell";

export default function NotFound() {
  return (
    <PageShell title="Not found" subtitle="Sản phẩm hoặc trang không tồn tại.">
      <Link
        href="/collections"
        className="inline-flex rounded-xl bg-nike-accent px-5 py-3 text-sm font-bold text-white"
      >
        Về Collections
      </Link>
    </PageShell>
  );
}
