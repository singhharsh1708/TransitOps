"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtMoney } from "@/lib/client";
import { Badge, Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";
import { VEHICLE_TYPES, VEHICLE_STATUS_LABELS } from "@/lib/constants";

type Vehicle = {
  id: number; registrationNo: string; name: string; type: string;
  maxLoadKg: number; odometer: number; acquisitionCost: number; region: string; status: string;
};

const EMPTY = { registrationNo: "", name: "", type: "Van", maxLoadKg: "", odometer: "", acquisitionCost: "", region: "General", status: "AVAILABLE" };

export default function VehiclesPage() {
  const canWrite = useCanWrite("vehicles");
  const [rows, setRows] = useState<Vehicle[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [type, setType] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    setRows(await api<Vehicle[]>(`/api/vehicles?${params}`));
  }, [q, status, type]);

  useEffect(() => { load(); }, [load]);

  function openCreate() {
    setEditing(null); setForm(EMPTY); setError(null); setModal(true);
  }
  function openEdit(v: Vehicle) {
    setEditing(v);
    setForm({
      registrationNo: v.registrationNo, name: v.name, type: v.type,
      maxLoadKg: String(v.maxLoadKg), odometer: String(v.odometer),
      acquisitionCost: String(v.acquisitionCost), region: v.region, status: v.status,
    });
    setError(null); setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError(null); setLoading(true);
    try {
      if (editing) {
        await api(`/api/vehicles/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      } else {
        await api("/api/vehicles", { method: "POST", body: JSON.stringify(form) });
      }
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function remove(v: Vehicle) {
    if (!confirm(`Delete ${v.registrationNo}?`)) return;
    try { await api(`/api/vehicles/${v.id}`, { method: "DELETE" }); await load(); }
    catch (err) { alert((err as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Vehicle Registry</h1>
          <p className="text-sm text-slate-500">Master list of fleet vehicles</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/vehicles" className="btn-ghost text-sm">Export CSV</a>
          {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ Add Vehicle</button>}
        </div>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or reg. no…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[10rem]" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="">All types</option>
          {VEHICLE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
        <select className="input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(VEHICLE_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Reg. No</th><th className="th">Name</th><th className="th">Type</th>
              <th className="th">Capacity</th><th className="th">Odometer</th><th className="th">Cost</th>
              <th className="th">Status</th>{canWrite && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((v) => (
              <tr key={v.id} className="row-hover">
                <td className="td font-medium">{v.registrationNo}</td>
                <td className="td">{v.name}</td>
                <td className="td">{v.type}</td>
                <td className="td">{v.maxLoadKg} kg</td>
                <td className="td">{v.odometer.toLocaleString()} km</td>
                <td className="td">{fmtMoney(v.acquisitionCost)}</td>
                <td className="td"><Badge status={v.status} label={VEHICLE_STATUS_LABELS[v.status]} /></td>
                {canWrite && (
                  <td className="td whitespace-nowrap">
                    <button onClick={() => openEdit(v)} className="text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => remove(v)} className="ml-3 text-red-600 hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No vehicles found" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Vehicle" : "Add Vehicle"}>
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Registration No</label>
            <input className="input" value={form.registrationNo} onChange={(e) => setForm({ ...form, registrationNo: e.target.value })} required /></div>
          <div className="col-span-2"><label className="label">Name / Model</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">Type</label>
            <select className="input" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select></div>
          <div><label className="label">Max Load (kg)</label>
            <input className="input" type="number" value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: e.target.value })} required /></div>
          <div><label className="label">Odometer (km)</label>
            <input className="input" type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: e.target.value })} /></div>
          <div><label className="label">Acquisition Cost</label>
            <input className="input" type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: e.target.value })} /></div>
          <div><label className="label">Region</label>
            <input className="input" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} /></div>
          <div><label className="label">Status</label>
            {/* On Trip / In Shop are set by the trip and maintenance workflows,
                so the manual picker only offers Available and Retired. */}
            {editing && (editing.status === "ON_TRIP" || editing.status === "IN_SHOP") ? (
              <select className="input" value={form.status} disabled>
                <option value={editing.status}>{VEHICLE_STATUS_LABELS[editing.status]}</option>
              </select>
            ) : (
              <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {["AVAILABLE", "RETIRED"].map((v) => <option key={v} value={v}>{VEHICLE_STATUS_LABELS[v]}</option>)}
              </select>
            )}</div>
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
