import { prisma } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";

// Aggregates all KPIs and chart datasets in a single call so the dashboard
// renders from one request.
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const [vehicles, drivers, trips, fuelLogs, expenses, maintenances] = await Promise.all([
    prisma.vehicle.findMany(),
    prisma.driver.findMany(),
    prisma.trip.findMany(),
    prisma.fuelLog.findMany(),
    prisma.expense.findMany(),
    prisma.maintenance.findMany(),
  ]);

  const nonRetired = vehicles.filter((v) => v.status !== "RETIRED");
  const onTrip = vehicles.filter((v) => v.status === "ON_TRIP").length;

  const kpis = {
    activeVehicles: nonRetired.length,
    availableVehicles: vehicles.filter((v) => v.status === "AVAILABLE").length,
    inMaintenance: vehicles.filter((v) => v.status === "IN_SHOP").length,
    activeTrips: trips.filter((t) => t.status === "DISPATCHED").length,
    pendingTrips: trips.filter((t) => t.status === "DRAFT").length,
    driversOnDuty: drivers.filter((d) => d.status === "ON_TRIP").length,
    fleetUtilization: nonRetired.length ? Math.round((onTrip / nonRetired.length) * 100) : 0,
  };

  // Per-vehicle operational cost and fuel efficiency for the reports section.
  const perVehicle = vehicles.map((v) => {
    const vFuel = fuelLogs.filter((f) => f.vehicleId === v.id);
    const vExp = expenses.filter((e) => e.vehicleId === v.id);
    const vMaint = maintenances.filter((m) => m.vehicleId === v.id);
    const vTrips = trips.filter((t) => t.vehicleId === v.id && t.status === "COMPLETED");

    const fuelCost = vFuel.reduce((s, f) => s + f.cost, 0);
    const fuelLiters = vFuel.reduce((s, f) => s + f.liters, 0);
    const maintCost = vMaint.reduce((s, m) => s + m.cost, 0);
    const expenseCost = vExp.reduce((s, e) => s + e.amount, 0);
    const revenue = vTrips.reduce((s, t) => s + t.revenue, 0);
    const distance = vTrips.reduce((s, t) => s + t.plannedDistance, 0);

    const operationalCost = fuelCost + maintCost + expenseCost;
    const fuelEfficiency = fuelLiters > 0 ? distance / fuelLiters : 0;
    const roi = v.acquisitionCost > 0
      ? (revenue - (maintCost + fuelCost)) / v.acquisitionCost
      : 0;

    return {
      id: v.id,
      registrationNo: v.registrationNo,
      name: v.name,
      operationalCost,
      fuelCost,
      maintCost,
      expenseCost,
      revenue,
      fuelEfficiency: Number(fuelEfficiency.toFixed(2)),
      roi: Number((roi * 100).toFixed(1)),
    };
  });

  const tripsByStatus = ["DRAFT", "DISPATCHED", "COMPLETED", "CANCELLED"].map((s) => ({
    status: s,
    count: trips.filter((t) => t.status === s).length,
  }));

  return ok({ kpis, perVehicle, tripsByStatus });
}
