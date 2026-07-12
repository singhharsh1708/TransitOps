"use client";

import { useEffect, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid,
} from "recharts";
import { api, fmtMoney } from "@/lib/client";

type Dashboard = {
  kpis: {
    activeVehicles: number;
    availableVehicles: number;
    inMaintenance: number;
    activeTrips: number;
    pendingTrips: number;
    driversOnDuty: number;
    fleetUtilization: number;
  };
  perVehicle: { registrationNo: string; operationalCost: number; fuelEfficiency: number; roi: number }[];
  tripsByStatus: { status: string; count: number }[];
};

const PIE_COLORS = ["#94a3b8", "#3b82f6", "#10b981", "#ef4444"];

function Kpi({ label, value, accent }: { label: string; value: string | number; accent?: string }) {
  return (
    <div className="card">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</div>
      <div className={`mt-2 text-3xl font-bold ${accent ?? ""}`}>{value}</div>
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
  if (!data) return <p className="text-slate-400">Loading dashboard…</p>;

  const k = data.kpis;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-slate-500">Fleet operations at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi label="Active Vehicles" value={k.activeVehicles} />
        <Kpi label="Available" value={k.availableVehicles} accent="text-emerald-600" />
        <Kpi label="In Maintenance" value={k.inMaintenance} accent="text-amber-600" />
        <Kpi label="Fleet Utilization" value={`${k.fleetUtilization}%`} accent="text-brand-600" />
        <Kpi label="Active Trips" value={k.activeTrips} accent="text-blue-600" />
        <Kpi label="Pending Trips" value={k.pendingTrips} />
        <Kpi label="Drivers On Duty" value={k.driversOnDuty} accent="text-blue-600" />
        <Kpi label="Fleet Size" value={k.activeVehicles + k.inMaintenance} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="card">
          <h2 className="mb-4 font-semibold">Operational Cost per Vehicle</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={data.perVehicle}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="registrationNo" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => fmtMoney(v)} />
              <Bar dataKey="operationalCost" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <h2 className="mb-4 font-semibold">Trips by Status</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.tripsByStatus} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={90} label>
                {data.tripsByStatus.map((_, i) => (
                  <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h2 className="mb-4 font-semibold">Fuel Efficiency (km/L) per Vehicle</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data.perVehicle}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="registrationNo" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} />
            <Tooltip />
            <Bar dataKey="fuelEfficiency" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
