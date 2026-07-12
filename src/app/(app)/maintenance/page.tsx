"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtMoney, fmtDate } from "@/lib/client";
import { Badge, Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";

type Maintenance = {
  id: number; title: string; description: string; cost: number; status: string;
  createdAt: string; vehicle: { registrationNo: string; name: string; status: string };
};
type VehicleOpt = { id: number; registrationNo: string; name: string; status: string };

export default function MaintenancePage() {
  const canWrite = useCanWrite("maintenance");
  const [rows, setRows] = useState<Maintenance[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", title: "", description: "", cost: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setRows(await api<Maintenance[]>("/api/maintenance"));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openCreate() {
    setForm({ vehicleId: "", title: "", description: "", cost: "" }); setError(null);
    const all = await api<VehicleOpt[]>("/api/vehicles");
    setVehicles(all.filter((v) => v.status !== "RETIRED" && v.status !== "ON_TRIP"));
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api("/api/maintenance", { method: "POST", body: JSON.stringify(form) });
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function close(m: Maintenance) {
    try { await api(`/api/maintenance/${m.id}/close`, { method: "POST" }); await load(); }
    catch (err) { alert((err as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Maintenance</h1>
          <p className="text-sm text-slate-500">Open a log to move a vehicle In Shop; close it to restore</p>
        </div>
        {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ New Maintenance</button>}
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Vehicle</th><th className="th">Title</th><th className="th">Description</th>
              <th className="th">Cost</th><th className="th">Opened</th><th className="th">Status</th>
              {canWrite && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((m) => (
              <tr key={m.id} className="row-hover">
                <td className="td font-medium">{m.vehicle.registrationNo}</td>
                <td className="td">{m.title}</td>
                <td className="td text-slate-500">{m.description || "—"}</td>
                <td className="td">{fmtMoney(m.cost)}</td>
                <td className="td">{fmtDate(m.createdAt)}</td>
                <td className="td"><Badge status={m.status} /></td>
                {canWrite && (
                  <td className="td">
                    {m.status === "OPEN"
                      ? <button onClick={() => close(m)} className="text-emerald-600 hover:underline">Close</button>
                      : <span className="text-slate-400">—</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No maintenance records" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="New Maintenance">
        <form onSubmit={save} className="space-y-3">
          <div><label className="label">Vehicle (available / in-shop only)</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name}</option>)}
            </select></div>
          <div><label className="label">Title</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
          <div><label className="label">Description</label>
            <textarea className="input" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div><label className="label">Cost</label>
            <input className="input" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
          <ErrorText message={error} />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : "Open Log"}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
