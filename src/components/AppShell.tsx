"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "@/lib/client";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { UserProvider } from "./UserContext";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: "▦" },
  { href: "/vehicles", label: "Vehicles", icon: "🚚" },
  { href: "/drivers", label: "Drivers", icon: "👤" },
  { href: "/trips", label: "Trips", icon: "🧭" },
  { href: "/maintenance", label: "Maintenance", icon: "🔧" },
  { href: "/fuel", label: "Fuel", icon: "⛽" },
  { href: "/expenses", label: "Expenses", icon: "💳" },
  { href: "/reports", label: "Reports", icon: "📊" },
];

function ThemeToggle() {
  const [dark, setDark] = useState(
    typeof document !== "undefined" && document.documentElement.classList.contains("dark"),
  );
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }
  return (
    <button onClick={toggle} className="btn-ghost px-2 py-1.5" aria-label="Toggle theme">
      {dark ? "☀️" : "🌙"}
    </button>
  );
}

export default function AppShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  async function logout() {
    await api("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-60 transform border-r border-slate-200 bg-white transition-transform dark:border-slate-800 dark:bg-slate-900 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-2 border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</div>
          <span className="font-bold">TransitOps</span>
        </div>
        <nav className="space-y-1 p-3">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-brand-600 text-white"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <span>{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      {open && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 px-4 backdrop-blur dark:border-slate-800 dark:bg-slate-900/80">
          <button className="btn-ghost px-2 py-1.5 lg:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="text-right">
              <div className="text-sm font-medium">{user.name}</div>
              <div className="text-xs text-slate-400">{ROLE_LABELS[user.role]}</div>
            </div>
            <button onClick={logout} className="btn-ghost px-3 py-1.5 text-sm">Logout</button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">
          <UserProvider user={user}>{children}</UserProvider>
        </main>
      </div>
    </div>
  );
}
