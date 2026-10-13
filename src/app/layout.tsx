import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "LaneLine",
  description: "Swim workout generator for swimmers and coaches.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex h-14 w-full max-w-6xl items-center px-6">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight text-slate-900">
              <span aria-hidden className="flex h-7 w-7 flex-col justify-center gap-1 rounded-md bg-sky-600 px-1.5">
                <span className="h-0.5 rounded bg-white" />
                <span className="h-0.5 rounded bg-white/70" />
                <span className="h-0.5 rounded bg-white" />
              </span>
              LaneLine
            </Link>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
