"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { api, fmtMoney } from "@/lib/client";
import { TableSkeleton } from "@/components/ui";

type Dashboard = {
  kpis: {
    activeVehicles: number; availableVehicles: number; inMaintenance: number;
    activeTrips: number; pendingTrips: number; driversOnDuty: number; fleetUtilization: number;
  };
  perVehicle: { registrationNo: string; operationalCost: number; fuelEfficiency: number; roi: number }[];
  tripsByStatus: { status: string; count: number }[];
};

const PIE_COLORS = ["#94a3b8", "#3b82f6", "#10b981", "#ef4444"];

const TILES = [
  { key: "activeVehicles", label: "Active Vehicles", icon: "▤", grad: "from-violet-500 to-purple-600" },
  { key: "availableVehicles", label: "Available", icon: "✓", grad: "from-emerald-500 to-teal-600" },
  { key: "inMaintenance", label: "In Maintenance", icon: "⚙", grad: "from-amber-500 to-orange-600" },
  { key: "fleetUtilization", label: "Fleet Utilization", icon: "◔", grad: "from-fuchsia-500 to-pink-600", suffix: "%" },
  { key: "activeTrips", label: "Active Trips", icon: "➤", grad: "from-blue-500 to-indigo-600" },
  { key: "pendingTrips", label: "Pending Trips", icon: "◷", grad: "from-slate-500 to-slate-700" },
  { key: "driversOnDuty", label: "Drivers On Duty", icon: "◉", grad: "from-cyan-500 to-blue-600" },
] as const;

function ChartTooltip({ active, payload, label, money }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-200 bg-white/95 px-3 py-2 text-xs shadow-lg backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="font-semibold">{label ?? payload[0].name}</div>
      <div className="text-slate-500">{money ? fmtMoney(payload[0].value) : payload[0].value}</div>
    </div>
  );
}

export default function DashboardPage() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<Dashboard>("/api/dashboard").then(setData).catch((e) => setError((e as Error).message));
  }, []);

  if (error) return <p className="text-red-600">{error}</p>;
  if (!data) return <div className="card"><TableSkeleton rows={4} cols={4} /></div>;

  const k = data.kpis as Record<string, number>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-slate-500">Fleet operations at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-7">
        {TILES.map((t, i) => (
          <motion.div
            key={t.key}
            className="relative overflow-hidden rounded-2xl border border-slate-200/70 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900/70"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br ${t.grad} text-white shadow-sm`}>
              {t.icon}
            </div>
            <div className="text-2xl font-bold tabular-nums">{k[t.key]}{"suffix" in t ? t.suffix : ""}</div>
            <div className="mt-0.5 text-xs font-medium text-slate-500">{t.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <h2 className="mb-4 font-semibold">Operational Cost per Vehicle</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.perVehicle}>
              <defs>
                <linearGradient id="barViolet" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8b5cf6" />
                  <stop offset="100%" stopColor="#6d28d9" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
              <XAxis dataKey="registrationNo" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip money />} cursor={{ fill: "rgba(124,58,237,0.06)" }} />
              <Bar dataKey="operationalCost" fill="url(#barViolet)" radius={[6, 6, 0, 0]} maxBarSize={48} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="mb-4 font-semibold">Trips by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.tripsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" innerRadius={55} outerRadius={92} paddingAngle={3} stroke="none">
                {data.tripsByStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 flex flex-wrap justify-center gap-3">
            {data.tripsByStatus.map((s, i) => (
              <div key={s.status} className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                {s.status} ({s.count})
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div className="card" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
        <h2 className="mb-4 font-semibold">Fuel Efficiency (km/L) per Vehicle</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.perVehicle}>
            <defs>
              <linearGradient id="barGreen" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34d399" />
                <stop offset="100%" stopColor="#059669" />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="registrationNo" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
            <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(16,185,129,0.06)" }} />
            <Bar dataKey="fuelEfficiency" fill="url(#barGreen)" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );
}
