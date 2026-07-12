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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-50 p-4 dark:bg-slate-950">
      {/* Ambient gradient blobs */}
      <div className="pointer-events-none absolute -left-40 -top-40 h-96 w-96 rounded-full bg-brand-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -right-40 h-96 w-96 rounded-full bg-blue-500/20 blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-sm"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="mb-7 text-center">
          <div className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-gradient text-2xl font-black text-white shadow-glow">T</div>
          <h1 className="text-2xl font-bold">TransitOps</h1>
          <p className="text-sm text-slate-500">Smart Transport Operations Platform</p>
        </div>

        <form onSubmit={submit} className="card-glass space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <ErrorText message={error} />
          <button className="btn-primary w-full py-2.5" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div className="mt-4 card-glass">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">Demo accounts · password123</p>
          <div className="grid gap-1">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword("password123"); }}
                className="flex items-center justify-between rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-white/70 dark:hover:bg-slate-800/60"
              >
                <span className="font-medium">{d.role}</span>
                <span className="text-xs text-slate-400">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
