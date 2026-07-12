"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/client";
import { ROLE_LABELS } from "@/lib/constants";
import type { SessionUser } from "@/lib/auth";
import { UserProvider } from "./UserContext";
import {
  IconDashboard, IconVehicle, IconDriver, IconTrip,
  IconMaintenance, IconFuel, IconExpense, IconReport,
} from "./icons";

const NAV = [
  { href: "/dashboard", label: "Dashboard", Icon: IconDashboard },
  { href: "/vehicles", label: "Vehicles", Icon: IconVehicle },
  { href: "/drivers", label: "Drivers", Icon: IconDriver },
  { href: "/trips", label: "Trips", Icon: IconTrip },
  { href: "/maintenance", label: "Maintenance", Icon: IconMaintenance },
  { href: "/fuel", label: "Fuel", Icon: IconFuel },
  { href: "/expenses", label: "Expenses", Icon: IconExpense },
  { href: "/reports", label: "Reports", Icon: IconReport },
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
    <button onClick={toggle} className="btn-ghost px-2.5 py-2" aria-label="Toggle theme">
      {dark ? "☀" : "☾"}
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

  const initials = user.name.split(" ").map((s) => s[0]).slice(0, 2).join("");

  return (
    <div className="flex min-h-screen bg-mesh">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 transform border-r border-slate-200/60 bg-white/80 backdrop-blur-xl transition-transform duration-300 dark:border-slate-800/60 dark:bg-slate-950/80 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-16 items-center gap-3 px-6">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-gradient text-sm font-black text-white shadow-glow">T</div>
          <div>
            <div className="text-sm font-bold leading-none">TransitOps</div>
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-slate-400">Fleet Platform</div>
          </div>
        </div>
        <nav className="space-y-1 px-3 py-4">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-brand-gradient text-white shadow-glow"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/60"
                }`}
              >
                <Icon className={active ? "" : "opacity-70 group-hover:opacity-100"} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-30 bg-slate-900/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Main */}
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-xl dark:border-slate-800/60 dark:bg-slate-950/70 sm:px-6">
          <button className="btn-ghost px-2.5 py-2 lg:hidden" onClick={() => setOpen(true)}>☰</button>
          <div className="hidden lg:block" />
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white/60 py-1.5 pl-3 pr-1.5 dark:border-slate-800/60 dark:bg-slate-900/40">
              <div className="text-right">
                <div className="text-sm font-semibold leading-none">{user.name}</div>
                <div className="mt-1 text-[11px] text-slate-400">{ROLE_LABELS[user.role]}</div>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-gradient text-xs font-bold text-white">{initials}</div>
            </div>
            <button onClick={logout} className="btn-ghost px-3 py-2 text-sm">Logout</button>
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <UserProvider user={user}>
            <AnimatePresence mode="wait">
              <motion.div
                key={pathname}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </UserProvider>
        </main>
      </div>
    </div>
  );
}
