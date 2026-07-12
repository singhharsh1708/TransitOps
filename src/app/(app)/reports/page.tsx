"use client";

import { useEffect, useState } from "react";
import { api, fmtMoney } from "@/lib/client";
import { Empty } from "@/components/ui";

type Row = {
  registrationNo: string; name: string; operationalCost: number; fuelCost: number;
  maintCost: number; expenseCost: number; revenue: number; fuelEfficiency: number; roi: number;
};

export default function ReportsPage() {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    api<{ perVehicle: Row[] }>("/api/dashboard").then((d) => setRows(d.perVehicle));
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <p className="text-sm text-slate-500">Operational cost, fuel efficiency and ROI per vehicle</p>
      </div>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[820px]">
          <thead className="border-b border-slate-200 dark:border-slate-800">
            <tr>
              <th className="th">Vehicle</th><th className="th">Fuel Cost</th><th className="th">Maint. Cost</th>
              <th className="th">Other Exp.</th><th className="th">Operational Cost</th>
              <th className="th">Revenue</th><th className="th">Efficiency (km/L)</th><th className="th">ROI</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {rows.map((r) => (
              <tr key={r.registrationNo} className="row-hover">
                <td className="td font-medium">{r.registrationNo}<div className="text-xs text-slate-400">{r.name}</div></td>
                <td className="td">{fmtMoney(r.fuelCost)}</td>
                <td className="td">{fmtMoney(r.maintCost)}</td>
                <td className="td">{fmtMoney(r.expenseCost)}</td>
                <td className="td font-semibold">{fmtMoney(r.operationalCost)}</td>
                <td className="td">{fmtMoney(r.revenue)}</td>
                <td className="td">{r.fuelEfficiency || "—"}</td>
                <td className="td">
                  <span className={r.roi >= 0 ? "text-emerald-600" : "text-red-600"}>{r.roi}%</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <Empty label="No data yet" />}
      </div>
    </div>
  );
}
