import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";

const schema = z.object({
  finalOdometer: z.coerce.number().min(0),
  fuelConsumed: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0).optional(),
  logFuelCost: z.coerce.number().min(0).optional(),
});

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("trips");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return fail("Trip not found", 404);
  if (trip.status !== "DISPATCHED") return fail("Only dispatched trips can be completed");

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.trip.update({
      where: { id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        finalOdometer: parsed.data.finalOdometer,
        fuelConsumed: parsed.data.fuelConsumed,
        ...(parsed.data.revenue !== undefined ? { revenue: parsed.data.revenue } : {}),
      },
    });
    // Completing a trip returns vehicle and driver to Available and updates odometer.
    await tx.vehicle.update({
      where: { id: trip.vehicleId },
      data: { status: "AVAILABLE", odometer: parsed.data.finalOdometer },
    });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });

    // Record the fuel consumed on this trip as a fuel log entry.
    if (parsed.data.fuelConsumed > 0) {
      await tx.fuelLog.create({
        data: {
          liters: parsed.data.fuelConsumed,
          cost: parsed.data.logFuelCost ?? 0,
          odometer: parsed.data.finalOdometer,
          vehicleId: trip.vehicleId,
          createdById: auth.user.id,
        },
      });
    }
    return t;
  });

  return ok(updated);
}
