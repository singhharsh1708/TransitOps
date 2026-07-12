"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtMoney, fmtDate } from "@/lib/client";
import { Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

type Expense = {
  id: number; category: string; amount: number; note: string; date: string;
  vehicle: { registrationNo: string };
};
type VehicleOpt = { id: number; registrationNo: string; name: string };

export default function ExpensesPage() {
  const canWrite = useCanWrite("expenses");
  const [rows, setRows] = useState<Expense[]>([]);
  const [vehicles, setVehicles] = useState<VehicleOpt[]>([]);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState({ vehicleId: "", category: "TOLL", amount: "", note: "" });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setRows(await api<Expense[]>("/api/expenses"));
  }, []);
  useEffect(() => { load(); }, [load]);

  async function openCreate() {
    setForm({ vehicleId: "", category: "TOLL", amount: "", note: "" }); setError(null);
    setVehicles(await api<VehicleOpt[]>("/api/vehicles"));
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api("/api/expenses", { method: "POST", body: JSON.stringify(form) });
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  const total = rows.reduce((s, r) => s + r.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Expenses</h1>
          <p className="text-sm text-slate-500">Total {fmtMoney(total)}</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/expenses" className="btn-ghost text-sm">Export CSV</a>
          {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ Add Expense</button>}
        </div>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[600px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Vehicle</th><th className="th">Category</th><th className="th">Amount</th>
              <th className="th">Note</th><th className="th">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.id}>
                <td className="td font-medium">{r.vehicle.registrationNo}</td>
                <td className="td">{r.category}</td>
                <td className="td">{fmtMoney(r.amount)}</td>
                <td className="td text-slate-500">{r.note || "—"}</td>
                <td className="td">{fmtDate(r.date)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No expenses" />}
      </div>

      <Modal open={modal} onClose={() => setModal(false)} title="Add Expense">
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className="label">Vehicle</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name}</option>)}
            </select></div>
          <div><label className="label">Category</label>
            <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              {EXPENSE_CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select></div>
          <div><label className="label">Amount</label>
            <input className="input" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} required /></div>
          <div className="col-span-2"><label className="label">Note</label>
            <input className="input" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></div>
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
