"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { AppLogo } from "@/components/AppLogo";
import { useAuth } from "@/components/AuthProvider";
import { signOut } from "@/services/auth";

const NAV = [
  { href: "/home", label: "Home", id: "home" },
  { href: "/home?view=records", label: "Records", id: "records" },
  { href: "/vitals", label: "Vitals", id: "vitals" },
  { href: "/insights", label: "Insights", id: "insights" },
];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { profile } = useAuth();
  const [open, setOpen] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.replace("/auth");
  }

  return (
    <div className="min-h-screen bg-[var(--foam)]">
      <header className="sticky top-0 z-30 border-b border-[var(--border)] bg-white/80 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              aria-label="Open menu"
              onClick={() => setOpen(true)}
              className="rounded-xl p-2 text-[var(--ink)] hover:bg-[var(--mist)]"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </button>
            <Link href="/home" className="flex items-center gap-2">
              <AppLogo size={32} />
              <span className="font-[family-name:var(--font-sora)] text-lg font-bold text-[var(--ink)]">
                Nemo Care
              </span>
            </Link>
          </div>
          <p className="hidden text-sm text-[var(--muted)] sm:block">
            {profile?.name ? `Hi, ${profile.name.split(" ")[0]}` : "Your health companion"}
          </p>
        </div>
      </header>

      {open ? (
        <div className="fixed inset-0 z-40">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute left-0 top-0 flex h-full w-[280px] flex-col bg-white shadow-xl">
            <div className="flex items-center gap-3 border-b border-[var(--border)] p-4">
              <AppLogo size={40} />
              <div>
                <p className="font-[family-name:var(--font-sora)] font-bold text-[var(--ink)]">
                  Nemo Care
                </p>
                <p className="text-xs text-[var(--muted)]">Personal health records</p>
              </div>
            </div>
            <nav className="flex-1 space-y-1 p-3">
              {NAV.map((item) => {
                const active =
                  item.id === "vitals"
                    ? pathname.startsWith("/vitals")
                    : item.id === "insights"
                      ? pathname.startsWith("/insights")
                      : pathname.startsWith("/home") && item.id !== "insights";
                return (
                  <Link
                    key={item.id}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`block rounded-xl px-3 py-2.5 text-sm font-medium ${
                      active
                        ? "bg-[var(--mist)] text-[var(--deep-teal)]"
                        : "text-[var(--ink)] hover:bg-[var(--foam)]"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
            <div className="space-y-1 border-t border-[var(--border)] p-3">
              <Link
                href="/onboarding?edit=1"
                onClick={() => setOpen(false)}
                className="block rounded-xl px-3 py-2.5 text-sm font-medium text-[var(--ink)] hover:bg-[var(--foam)]"
              >
                Edit health profile
              </Link>
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[var(--coral)] hover:bg-red-50"
              >
                Sign out
              </button>
            </div>
          </aside>
        </div>
      ) : null}

      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}
