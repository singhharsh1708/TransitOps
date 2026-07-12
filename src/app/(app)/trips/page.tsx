"use client";

import { useEffect, useState, useCallback } from "react";
import { api, fmtMoney } from "@/lib/client";
import { Badge, Modal, ErrorText, Empty } from "@/components/ui";
import { useCanWrite } from "@/components/UserContext";
import { TRIP_STATUS_LABELS } from "@/lib/constants";

type Trip = {
  id: number; source: string; destination: string; cargoWeightKg: number; plannedDistance: number;
  revenue: number; status: string; vehicle: { registrationNo: string; maxLoadKg: number };
  driver: { name: string }; createdBy?: { name: string } | null;
};
type Options = {
  vehicles: { id: number; registrationNo: string; name: string; maxLoadKg: number }[];
  drivers: { id: number; name: string; licenseNo: string; safetyScore: number }[];
};

const EMPTY = { source: "", destination: "", vehicleId: "", driverId: "", cargoWeightKg: "", plannedDistance: "", revenue: "0" };

export default function TripsPage() {
  const canWrite = useCanWrite("trips");
  const [rows, setRows] = useState<Trip[]>([]);
  const [status, setStatus] = useState("");
  const [options, setOptions] = useState<Options>({ vehicles: [], drivers: [] });
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Record<string, string>>(EMPTY);
  const [dispatchNow, setDispatchNow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Completion modal state.
  const [completeFor, setCompleteFor] = useState<Trip | null>(null);
  const [completeForm, setCompleteForm] = useState({ finalOdometer: "", fuelConsumed: "", revenue: "", logFuelCost: "" });
  const [completeError, setCompleteError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const params = new URLSearchParams();
    if (status) params.set("status", status);
    setRows(await api<Trip[]>(`/api/trips?${params}`));
  }, [status]);

  useEffect(() => { load(); }, [load]);

  async function openCreate() {
    setForm(EMPTY); setDispatchNow(false); setError(null);
    setOptions(await api<Options>("/api/trips/options"));
    setModal(true);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault(); setError(null); setLoading(true);
    try {
      await api("/api/trips", { method: "POST", body: JSON.stringify({ ...form, dispatchNow }) });
      setModal(false); await load();
    } catch (err) { setError((err as Error).message); }
    finally { setLoading(false); }
  }

  async function act(trip: Trip, action: "dispatch" | "cancel") {
    try { await api(`/api/trips/${trip.id}/${action}`, { method: "POST" }); await load(); }
    catch (err) { alert((err as Error).message); }
  }

  function openComplete(trip: Trip) {
    setCompleteFor(trip);
    setCompleteForm({ finalOdometer: "", fuelConsumed: "", revenue: String(trip.revenue), logFuelCost: "" });
    setCompleteError(null);
  }

  async function submitComplete(e: React.FormEvent) {
    e.preventDefault(); setCompleteError(null);
    if (!completeFor) return;
    try {
      await api(`/api/trips/${completeFor.id}/complete`, { method: "POST", body: JSON.stringify(completeForm) });
      setCompleteFor(null); await load();
    } catch (err) { setCompleteError((err as Error).message); }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Trip Management</h1>
          <p className="text-sm text-slate-500">Dispatch, track and close trips</p>
        </div>
        <div className="flex gap-2">
          <a href="/api/export/trips" className="btn-ghost text-sm">Export CSV</a>
          {canWrite && <button onClick={openCreate} className="btn-primary text-sm">+ New Trip</button>}
        </div>
      </div>

      <div className="card flex flex-wrap gap-3">
        <select className="input max-w-[12rem]" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.entries(TRIP_STATUS_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Route</th><th className="th">Vehicle</th><th className="th">Driver</th>
              <th className="th">Cargo</th><th className="th">Distance</th><th className="th">Revenue</th>
              <th className="th">Status</th>{canWrite && <th className="th">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((t) => (
              <tr key={t.id}>
                <td className="td font-medium">{t.source} → {t.destination}</td>
                <td className="td">{t.vehicle.registrationNo}</td>
                <td className="td">{t.driver.name}</td>
                <td className="td">{t.cargoWeightKg} kg</td>
                <td className="td">{t.plannedDistance} km</td>
                <td className="td">{fmtMoney(t.revenue)}</td>
                <td className="td"><Badge status={t.status} label={TRIP_STATUS_LABELS[t.status]} /></td>
                {canWrite && (
                  <td className="td whitespace-nowrap">
                    {t.status === "DRAFT" && (
                      <>
                        <button onClick={() => act(t, "dispatch")} className="text-brand-600 hover:underline">Dispatch</button>
                        <button onClick={() => act(t, "cancel")} className="ml-3 text-red-600 hover:underline">Cancel</button>
                      </>
                    )}
                    {t.status === "DISPATCHED" && (
                      <>
                        <button onClick={() => openComplete(t)} className="text-emerald-600 hover:underline">Complete</button>
                        <button onClick={() => act(t, "cancel")} className="ml-3 text-red-600 hover:underline">Cancel</button>
                      </>
                    )}
                    {(t.status === "COMPLETED" || t.status === "CANCELLED") && <span className="text-slate-400">—</span>}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No trips found" />}
      </div>

      {/* Create trip */}
      <Modal open={modal} onClose={() => setModal(false)} title="New Trip">
        <form onSubmit={save} className="grid grid-cols-2 gap-3">
          <div><label className="label">Source</label>
            <input className="input" value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required /></div>
          <div><label className="label">Destination</label>
            <input className="input" value={form.destination} onChange={(e) => setForm({ ...form, destination: e.target.value })} required /></div>
          <div className="col-span-2"><label className="label">Vehicle (available only)</label>
            <select className="input" value={form.vehicleId} onChange={(e) => setForm({ ...form, vehicleId: e.target.value })} required>
              <option value="">Select vehicle…</option>
              {options.vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.name} (max {v.maxLoadKg}kg)</option>)}
            </select></div>
          <div className="col-span-2"><label className="label">Driver (eligible only)</label>
            <select className="input" value={form.driverId} onChange={(e) => setForm({ ...form, driverId: e.target.value })} required>
              <option value="">Select driver…</option>
              {options.drivers.map((d) => <option key={d.id} value={d.id}>{d.name} — {d.licenseNo} (safety {d.safetyScore})</option>)}
            </select></div>
          <div><label className="label">Cargo Weight (kg)</label>
            <input className="input" type="number" value={form.cargoWeightKg} onChange={(e) => setForm({ ...form, cargoWeightKg: e.target.value })} required /></div>
          <div><label className="label">Planned Distance (km)</label>
            <input className="input" type="number" value={form.plannedDistance} onChange={(e) => setForm({ ...form, plannedDistance: e.target.value })} required /></div>
          <div className="col-span-2"><label className="label">Expected Revenue</label>
            <input className="input" type="number" value={form.revenue} onChange={(e) => setForm({ ...form, revenue: e.target.value })} /></div>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dispatchNow} onChange={(e) => setDispatchNow(e.target.checked)} />
            Dispatch immediately (runs all business-rule checks)
          </label>
          <div className="col-span-2"><ErrorText message={error} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setModal(false)} className="btn-ghost">Cancel</button>
            <button className="btn-primary" disabled={loading}>{loading ? "Saving…" : dispatchNow ? "Create & Dispatch" : "Create Draft"}</button>
          </div>
        </form>
      </Modal>

      {/* Complete trip */}
      <Modal open={!!completeFor} onClose={() => setCompleteFor(null)} title="Complete Trip">
        <form onSubmit={submitComplete} className="grid grid-cols-2 gap-3">
          <div><label className="label">Final Odometer (km)</label>
            <input className="input" type="number" value={completeForm.finalOdometer} onChange={(e) => setCompleteForm({ ...completeForm, finalOdometer: e.target.value })} required /></div>
          <div><label className="label">Fuel Consumed (L)</label>
            <input className="input" type="number" value={completeForm.fuelConsumed} onChange={(e) => setCompleteForm({ ...completeForm, fuelConsumed: e.target.value })} required /></div>
          <div><label className="label">Revenue</label>
            <input className="input" type="number" value={completeForm.revenue} onChange={(e) => setCompleteForm({ ...completeForm, revenue: e.target.value })} /></div>
          <div><label className="label">Fuel Cost (optional)</label>
            <input className="input" type="number" value={completeForm.logFuelCost} onChange={(e) => setCompleteForm({ ...completeForm, logFuelCost: e.target.value })} /></div>
          <div className="col-span-2"><ErrorText message={completeError} /></div>
          <div className="col-span-2 flex justify-end gap-2">
            <button type="button" onClick={() => setCompleteFor(null)} className="btn-ghost">Cancel</button>
            <button className="btn-primary">Mark Completed</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
