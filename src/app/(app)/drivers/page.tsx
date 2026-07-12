"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtDate } from "@/lib/client";
import { Badge, Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";
import { LICENSE_CATEGORIES, DRIVER_STATUS_LABELS } from "@/lib/constants";

type Driver = {
  id: number; name: string; licenseNo: string; licenseCategory: string;
  licenseExpiry: string; contactNo: string; safetyScore: number; status: string;
};

const EMPTY = { name: "", licenseNo: "", licenseCategory: "LMV", licenseExpiry: "", contactNo: "", safetyScore: "100", status: "AVAILABLE" };

function expired(dateStr: string) {
  return new Date(dateStr).getTime() < Date.now();
}

export default function DriversPage() {
  const canWrite = useCanWrite("drivers");
  const [rows, setRows] = useState<Driver[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState<Driver | null>(null);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (status) params.set("status", status);
    setRows(await api<Driver[]>(`/api/drivers?${params}`));
  }, [q, status]);

  useEffect(() => { load(); }, [load]);

  function openCreate() { setEditing(null); setForm(EMPTY); setError(null); setModal(true); }
  function openEdit(d: Driver) {
    setEditing(d);
    setForm({
      name: d.name, licenseNo: d.licenseNo, licenseCategory: d.licenseCategory,
      licenseExpiry: d.licenseExpiry.slice(0, 10), contactNo: d.contactNo,
      safetyScore: String(d.safetyScore), status: d.status,
    });
    setError(null); setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      if (editing) await api(`/api/drivers/${editing.id}`, { method: "PATCH", body: JSON.stringify(form) });
      else await api("/api/drivers", { method: "POST", body: JSON.stringify(form) });
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function remove(d: Driver) {
    if (!confirm(`Delete ${d.name}?`)) return;
    try { await api(`/api/drivers/${d.id}`, { method: "DELETE" }); await load(); }
    catch (err) { alert((err as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Driver Management</h1>
          <p className="text-sm text-slate-500">Driver profiles, licenses and safety</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/drivers" className="btn-ghost text-sm">Export CSV</a>
          {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ Add Driver</button>}
        </div>
      </div>

      <div className="card flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name or license…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input max-w-[10rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(DRIVER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Name</th><th className="th">License</th><th className="th">Category</th>
              <th className="th">Expiry</th><th className="th">Contact</th><th className="th">Safety</th>
              <th className="th">Status</th>{canWrite && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((d) => (
              <tr key={d.id}>
                <td className="td font-medium">{d.name}</td>
                <td className="td">{d.licenseNo}</td>
                <td className="td">{d.licenseCategory}</td>
                <td className="td">
                  <span className={expired(d.licenseExpiry) ? "font-semibold text-red-600" : ""}>
                    {fmtDate(d.licenseExpiry)}{expired(d.licenseExpiry) ? " (expired)" : ""}
                  </span>
                </td>
                <td className="td">{d.contactNo}</td>
                <td className="td">{d.safetyScore}</td>
                <td className="td"><Badge status={d.status} label={DRIVER_STATUS_LABELS[d.status]} /></td>
                {canWrite && (
                  <td className="td whitespace-nowrap">
                    <button onClick={() => openEdit(d)} className="text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => remove(d)} className="ml-3 text-red-600 hover:underline">Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No drivers found" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? "Edit Driver" : "Add Driver"}>
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Name</label>
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required /></div>
          <div><label className="label">License No</label>
            <input className="input" value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} required /></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
              {LICENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="label">License Expiry</label>
            <input className="input" type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} required /></div>
          <div><label className="label">Contact No</label>
            <input className="input" value={form.contactNo} onChange={(e) => setForm({ ...form, contactNo: e.target.value })} required /></div>
          <div><label className="label">Safety Score</label>
            <input className="input" type="number" min="0" max="100" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: e.target.value })} /></div>
          <div><label className="label">Status</label>
            <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
              {Object.entries(DRIVER_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select></div>
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
