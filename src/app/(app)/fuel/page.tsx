"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtMoney, fmtDate } from "@/lib/client";
import { Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";

type FuelLog = {
  id: number; liters: number; cost: number; odometer: number; date: string;
  vehicle: { registrationNo: string };
};
type VehicleOpt = { id: number; registrationNo: string; name: string };

export default function FuelPage() {
  const canWrite = useCanWrite("fuel");
  const [rows, setRows] = useState<FuelLog[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", liters: "", cost: "", odometer: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setRows(await api<FuelLog[]>("/api/fuel"));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openCreate() {
    setForm({ vehicleId: "", liters: "", cost: "", odometer: "" }); setError(null);
    setVehicles(await api<VehicleOpt[]>("/api/vehicles"));
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api("/api/fuel", { method: "POST", body: JSON.stringify(form) });
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  const totalLiters = rows.reduce((s, r) => s + r.liters, 0);
  const totalCost = rows.reduce((s, r) => s + r.cost, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Fuel Logs</h1>
          <p className="text-sm text-slate-500">Total {totalLiters.toLocaleString()} L · {fmtMoney(totalCost)}</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/fuel" className="btn-ghost text-sm">Export CSV</a>
          {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ Log Fuel</button>}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Vehicle</th><th className="th">Liters</th><th className="th">Cost</th>
              <th className="th">Odometer</th><th className="th">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id} className="row-hover">
                <td className="td font-medium">{r.vehicle.registrationNo}</td>
                <td className="td">{r.liters} L</td>
                <td className="td">{fmtMoney(r.cost)}</td>
                <td className="td">{r.odometer.toLocaleString()} km</td>
                <td className="td">{fmtDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No fuel logs" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Log Fuel">
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Vehicle</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name}</option>)}
            </select></div>
          <div><label className="label">Liters</label>
            <input className="input" type="number" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} required /></div>
          <div><label className="label">Cost</label>
            <input className="input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} required /></div>
          <div className="col-span-2"><label className="label">Odometer (km)</label>
            <input className="input" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
          <div className="col-span-2"><ErrorText message={error} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
