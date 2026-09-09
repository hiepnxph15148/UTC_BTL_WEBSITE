export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50 font-sans dark:bg-black">
      <header className="border-b border-black/[.06] bg-white dark:border-white/[.08] dark:bg-zinc-950">
        <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-6">
          <span className="text-sm font-semibold tracking-tight">UTC ASM</span>
          <nav className="flex items-center gap-6 text-sm text-zinc-600 dark:text-zinc-400">
            <a href="#features" className="hover:text-zinc-950 dark:hover:text-zinc-50">
              Tính năng
            </a>
            <a href="#stack" className="hover:text-zinc-950 dark:hover:text-zinc-50">
              Công nghệ
            </a>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-16 px-6 py-16">
        <section className="flex max-w-2xl flex-col gap-6">
          <p className="text-sm font-medium text-zinc-500">Frontend Next.js</p>
          <h1 className="text-4xl font-semibold tracking-tight text-zinc-950 dark:text-zinc-50 sm:text-5xl">
            Project frontend đã sẵn sàng để phát triển
          </h1>
          <p className="text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            Đây là ứng dụng Next.js (App Router) với TypeScript và Tailwind CSS.
            Chỉnh file{" "}
            <code className="rounded bg-black/[.06] px-1.5 py-0.5 font-mono text-[0.9em] dark:bg-white/[.08]">
              src/app/page.tsx
            </code>{" "}
            để bắt đầu xây giao diện.
          </p>
          <div className="flex flex-wrap gap-3">
            <a
              href="https://nextjs.org/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full bg-zinc-950 px-5 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-950 dark:hover:bg-zinc-200"
            >
              Tài liệu Next.js
            </a>
            <a
              href="https://tailwindcss.com/docs"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center rounded-full border border-black/[.08] px-5 text-sm font-medium hover:bg-black/[.04] dark:border-white/[.14] dark:hover:bg-white/[.06]"
            >
              Tài liệu Tailwind
            </a>
          </div>
        </section>

        <section id="features" className="grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "App Router",
              desc: "Routing theo thư mục trong src/app, hỗ trợ layout và metadata.",
            },
            {
              title: "TypeScript",
              desc: "Type-safe từ component đến API, dễ bảo trì khi project lớn dần.",
            },
            {
              title: "Tailwind CSS",
              desc: "Utility-first styling, xây UI nhanh mà không cần file CSS rời.",
            },
          ].map((item) => (
            <article
              key={item.title}
              className="rounded-2xl border border-black/[.08] bg-white p-5 dark:border-white/[.1] dark:bg-zinc-950"
            >
              <h2 className="text-base font-semibold text-zinc-950 dark:text-zinc-50">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-zinc-600 dark:text-zinc-400">
                {item.desc}
              </p>
            </article>
          ))}
        </section>

        <section id="stack" className="rounded-2xl border border-black/[.08] bg-white p-6 dark:border-white/[.1] dark:bg-zinc-950">
          <h2 className="text-base font-semibold">Chạy project</h2>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-zinc-950 p-4 font-mono text-sm text-zinc-100">
            npm run dev
          </pre>
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
            Mở{" "}
            <a className="underline" href="http://localhost:3000">
              http://localhost:3000
            </a>{" "}
            trên trình duyệt.
          </p>
        </section>
      </main>
    </div>
  );
}
