import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";
import { validateDispatch } from "@/lib/rules";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("trips");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return fail("Trip not found", 404);
  if (trip.status !== "DRAFT") return fail("Only draft trips can be dispatched");

  const check = await validateDispatch({
    vehicleId: trip.vehicleId,
    driverId: trip.driverId,
    cargoWeightKg: trip.cargoWeightKg,
  });
  if (!check.ok) return fail(check.message);

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.trip.update({
      where: { id },
      data: { status: "DISPATCHED", dispatchedAt: new Date() },
    });
    await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } });
    await tx.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } });
    return t;
  });

  return ok(updated);
}
