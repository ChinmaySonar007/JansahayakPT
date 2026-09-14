"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useLanguage, type Language } from "@/lib/language-context";
import { User, LogOut, Languages } from "lucide-react";

export default function Nav() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const links = [
    { href: "/", label: t.nav.consumer },
    { href: "/worker", label: t.nav.worker },
    { href: "/admin", label: t.nav.admin },
  ];

  return (
    <header className="border-b border-paper-line bg-paper sticky top-0 z-20">
      <div className="mx-auto max-w-5xl px-5 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-display text-xl text-teal-deep tracking-tight font-bold">
            JanSahayak
          </Link>
          <nav className="hidden sm:flex gap-1 text-sm">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={`px-3 py-1.5 rounded-full transition-colors text-xs sm:text-sm font-medium ${
                    active
                      ? "bg-teal text-paper shadow-xs"
                      : "text-ink-soft hover:text-ink hover:bg-black/5"
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-2 text-xs">
          {/* Global Language Selector */}
          <div className="flex items-center gap-1 bg-white/80 border border-paper-line rounded-full px-2.5 py-1 text-xs shadow-2xs hover:border-teal/50 transition-colors">
            <Languages className="w-3.5 h-3.5 text-teal shrink-0" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Select platform language"
              className="bg-transparent text-xs font-semibold text-teal-deep outline-hidden cursor-pointer"
            >
              <option value="en">English (EN)</option>
              <option value="hi">हिन्दी (HI)</option>
              <option value="ml">മലയാളം (ML)</option>
            </select>
          </div>
          {user ? (
            <div className="flex items-center gap-2 bg-white/70 border border-paper-line px-2.5 py-1 rounded-full shadow-2xs">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-semibold text-ink">{user.name}</span>
                {user.role === "worker" && user.categoryName && (
                  <span className="text-[10px] bg-teal/10 text-teal-deep px-1.5 py-0.5 rounded-full font-medium">
                    {user.categoryName}
                  </span>
                )}
                {user.role === "consumer" && (
                  <span className="text-[10px] bg-paper-line/60 text-ink-soft px-1.5 py-0.5 rounded-full font-medium">
                    {t.nav.roleConsumer}
                  </span>
                )}
                {user.role === "admin" && (
                  <span className="text-[10px] bg-marigold/20 text-marigold-deep px-1.5 py-0.5 rounded-full font-medium">
                    {t.nav.roleAdmin}
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                title={t.nav.logout}
                className="p-1 rounded-full hover:bg-black/5 text-ink-soft hover:text-terracotta transition-colors"
              >
                <LogOut className="w-3 h-3" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Link
                href="/login"
                className={`px-3 py-1.5 rounded-full transition-colors font-medium ${
                  pathname === "/login"
                    ? "bg-teal text-paper"
                    : "text-ink-soft hover:text-ink hover:bg-black/5"
                }`}
              >
                {t.nav.signIn}
              </Link>
              <Link
                href="/signup"
                className={`px-3 py-1.5 rounded-full border border-paper-line bg-white/80 hover:bg-white text-teal-deep font-semibold shadow-2xs transition-colors ${
                  pathname === "/signup" ? "border-teal" : ""
                }`}
              >
                {t.nav.register}
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation Strip (Visible on mobile/tablet screens < 640px) */}
      <div className="sm:hidden flex items-center justify-around border-t border-paper-line/60 py-2 px-3 bg-paper/95 text-xs font-medium">
        {links.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={`px-3 py-1 rounded-full transition-colors ${
                active
                  ? "bg-teal text-paper font-semibold shadow-xs"
                  : "text-ink-soft hover:text-ink hover:bg-black/5"
              }`}
            >
              {l.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

