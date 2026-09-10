import type { Metadata } from "next";
import { Manrope, Syne } from "next/font/google";
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
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="vi"
      className={`${manrope.variable} ${syne.variable} h-full antialiased`}
    >
      <body className="h-full overflow-x-hidden overflow-y-auto lg:overflow-hidden">
        {children}
      </body>
    </html>
  );
}
