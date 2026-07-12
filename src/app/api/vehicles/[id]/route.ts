import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";
import { VEHICLE_TYPES } from "@/lib/constants";

const updateSchema = z.object({
  registrationNo: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.enum(VEHICLE_TYPES as [string, ...string[]]).optional(),
  maxLoadKg: z.coerce.number().positive().optional(),
  odometer: z.coerce.number().min(0).optional(),
  acquisitionCost: z.coerce.number().min(0).optional(),
  region: z.string().optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "IN_SHOP", "RETIRED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("vehicles");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  if (parsed.data.registrationNo) {
    const dup = await prisma.vehicle.findFirst({
      where: { registrationNo: parsed.data.registrationNo, NOT: { id } },
    });
    if (dup) return fail("Registration number must be unique", 409);
  }

  const vehicle = await prisma.vehicle.update({ where: { id }, data: parsed.data });
  return ok(vehicle);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("vehicles");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  // Deleting a vehicle that owns any history would violate foreign keys, so
  // block it with a clear message instead of surfacing a 500. Retire it instead.
  const [trips, fuelLogs, expenses, maintenances] = await Promise.all([
    prisma.trip.count({ where: { vehicleId: id } }),
    prisma.fuelLog.count({ where: { vehicleId: id } }),
    prisma.expense.count({ where: { vehicleId: id } }),
    prisma.maintenance.count({ where: { vehicleId: id } }),
  ]);
  if (trips + fuelLogs + expenses + maintenances > 0) {
    return fail("Cannot delete a vehicle with trip, fuel, expense or maintenance history; set it to Retired instead", 409);
  }

  await prisma.vehicle.delete({ where: { id } });
  return ok({ success: true });
}
