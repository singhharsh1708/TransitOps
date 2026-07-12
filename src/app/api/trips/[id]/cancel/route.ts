import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("trips");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const trip = await prisma.trip.findUnique({ where: { id } });
  if (!trip) return fail("Trip not found", 404);
  if (trip.status === "COMPLETED" || trip.status === "CANCELLED") {
    return fail("Trip is already closed");
  }

  const wasDispatched = trip.status === "DISPATCHED";

  const updated = await prisma.$transaction(async (tx) => {
    const t = await tx.trip.update({ where: { id }, data: { status: "CANCELLED" } });
    // Cancelling a dispatched trip restores vehicle and driver to Available.
    if (wasDispatched) {
      await tx.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } });
      await tx.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } });
    }
    return t;
  });

  return ok(updated);
}
