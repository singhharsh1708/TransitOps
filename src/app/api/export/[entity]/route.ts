import { prisma } from "@/lib/db";
import { fail, requireAuth } from "@/lib/api";

// Serialises a row set to CSV, quoting values that contain commas or quotes.
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown) => {
    const s = val === null || val === undefined ? "" : String(val);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) lines.push(headers.map((h) => escape(row[h])).join(","));
  return lines.join("\n");
}

export async function GET(_req: Request, { params }: { params: { entity: string } }) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  let rows: Record<string, unknown>[] = [];

  switch (params.entity) {
    case "vehicles":
      rows = (await prisma.vehicle.findMany({ orderBy: { id: "asc" } })).map((v) => ({
        id: v.id, registrationNo: v.registrationNo, name: v.name, type: v.type,
        maxLoadKg: v.maxLoadKg, odometer: v.odometer, acquisitionCost: v.acquisitionCost,
        region: v.region, status: v.status,
      }));
      break;
    case "drivers":
      rows = (await prisma.driver.findMany({ orderBy: { id: "asc" } })).map((d) => ({
        id: d.id, name: d.name, licenseNo: d.licenseNo, licenseCategory: d.licenseCategory,
        licenseExpiry: d.licenseExpiry.toISOString().slice(0, 10), contactNo: d.contactNo,
        safetyScore: d.safetyScore, status: d.status,
      }));
      break;
    case "trips":
      rows = (await prisma.trip.findMany({ include: { vehicle: true, driver: true }, orderBy: { id: "asc" } })).map((t) => ({
        id: t.id, source: t.source, destination: t.destination, vehicle: t.vehicle.registrationNo,
        driver: t.driver.name, cargoWeightKg: t.cargoWeightKg, plannedDistance: t.plannedDistance,
        fuelConsumed: t.fuelConsumed ?? "", revenue: t.revenue, status: t.status,
      }));
      break;
    case "fuel":
      rows = (await prisma.fuelLog.findMany({ include: { vehicle: true }, orderBy: { id: "asc" } })).map((f) => ({
        id: f.id, vehicle: f.vehicle.registrationNo, liters: f.liters, cost: f.cost,
        odometer: f.odometer, date: f.date.toISOString().slice(0, 10),
      }));
      break;
    case "expenses":
      rows = (await prisma.expense.findMany({ include: { vehicle: true }, orderBy: { id: "asc" } })).map((e) => ({
        id: e.id, vehicle: e.vehicle.registrationNo, category: e.category, amount: e.amount,
        note: e.note, date: e.date.toISOString().slice(0, 10),
      }));
      break;
    default:
      return fail("Unknown export entity", 404);
  }

  const csv = toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${params.entity}.csv"`,
    },
  });
}
