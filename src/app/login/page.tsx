"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/client";
import { ErrorText } from "@/components/ui";

const DEMO = [
  { email: "fleet@transitops.com", role: "Fleet Manager" },
  { email: "driver@transitops.com", role: "Driver" },
  { email: "safety@transitops.com", role: "Safety Officer" },
  { email: "finance@transitops.com", role: "Financial Analyst" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("fleet@transitops.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen bg-[#070b14] text-white">
      {/* Left: visual / marketing panel */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden border-r border-white/5 p-12 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-70"
          style={{ backgroundImage: "url(/images/login-graphic.png)" }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/40 to-transparent" />
        <div className="relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-gradient text-lg font-black shadow-glow">T</div>
          <h2 className="mt-8 text-4xl font-bold tracking-tight">TransitOps</h2>
          <p className="mt-2 max-w-sm text-slate-300">Smart Transport Operations & Dispatch Control Center</p>
        </div>
        <div className="relative z-10 flex gap-8 text-sm">
          <div><div className="text-2xl font-bold">Real-time</div><div className="text-slate-400">Fleet visibility</div></div>
          <div><div className="text-2xl font-bold">RBAC</div><div className="text-slate-400">Role-scoped access</div></div>
          <div><div className="text-2xl font-bold">Analytics</div><div className="text-slate-400">Cost & ROI</div></div>
        </div>
      </div>

      {/* Right: interactive login panel */}
      <div className="relative flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="pointer-events-none absolute -right-32 top-0 h-96 w-96 rounded-full bg-brand-500/20 blur-3xl" />
        <motion.div
          className="relative z-10 w-full max-w-sm space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="lg:hidden">
            <div className="mb-3 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-gradient text-xl font-black shadow-glow">T</div>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-slate-400">Sign in with a demo account to get started.</p>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Email</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-400">Password</label>
              <input
                className="w-full rounded-xl border border-white/10 bg-white/5 px-3.5 py-2.5 text-sm text-white outline-none transition-all placeholder:text-slate-500 focus:border-brand-500 focus:ring-4 focus:ring-brand-500/20"
                type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
              />
            </div>
            <ErrorText message={error} />
            <button className="btn-primary w-full py-2.5" disabled={loading}>
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md">
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo accounts · password123</p>
            <div className="grid gap-1">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  onClick={() => { setEmail(d.email); setPassword("password123"); }}
                  className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/10"
                >
                  <span className="font-medium">{d.role}</span>
                  <span className="text-xs text-slate-500">{d.email}</span>
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
