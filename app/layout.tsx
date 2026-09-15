import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prestige Jobs MY — Elite internships & graduate programmes in Malaysia",
  description:
    "A curated board of prestigious internships and fresh-graduate programmes at top firms in Malaysia: banking, consulting, FMCG, Big Tech and more.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
            <Link href="/" className="flex items-center gap-2">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-600 text-lg font-bold text-white">
                P
              </span>
              <div className="leading-tight">
                <div className="text-lg font-semibold tracking-tight">
                  Prestige Jobs <span className="text-brand-600">MY</span>
                </div>
                <div className="text-xs text-slate-500">
                  Elite internships & graduate programmes in Malaysia
                </div>
              </div>
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium">
              <Link href="/" className="text-slate-600 hover:text-brand-600">
                Browse
              </Link>
              <Link
                href="/admin"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 hover:border-brand-500 hover:text-brand-600"
              >
                Admin
              </Link>
            </nav>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6">{children}</main>
        <footer className="mt-12 border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 text-center text-xs text-slate-500 sm:px-6">
            Prestige Jobs MY — a curated, non-affiliated compilation. Always
            verify dates on the official employer page before applying.
          </div>
        </footer>
      </body>
    </html>
  );
}
