import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
import Providers from "@/components/Providers";
import "./globals.css";

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Nike Store | UTC ASM",
  description: "Nike shoes store với 3D carousel tương tác",
  icons: {
    icon: [{ url: "/logo/nike-black.png", type: "image/png" }],
    apple: [{ url: "/logo/nike-black.png", type: "image/png" }],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${manrope.variable} ${syne.variable} antialiased`}
    >
      <body className="min-h-dvh bg-[#121218]" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
