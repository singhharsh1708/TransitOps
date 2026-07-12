"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-50 to-slate-100 p-4 dark:from-slate-950 dark:to-slate-900">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-2xl font-bold text-white">T</div>
          <h1 className="text-2xl font-bold">TransitOps</h1>
          <p className="text-sm text-slate-500">Smart Transport Operations Platform</p>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          <div>
            <label className="label">Email</label>
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <label className="label">Password</label>
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <ErrorText message={error} />
          <button className="btn-primary w-full" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="mt-4 card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Demo accounts (password123)</p>
          <div className="space-y-1">
            {DEMO.map((d) => (
              <button
                key={d.email}
                onClick={() => { setEmail(d.email); setPassword("password123"); }}
                className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left text-sm hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <span className="font-medium">{d.role}</span>
                <span className="text-xs text-slate-400">{d.email}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
