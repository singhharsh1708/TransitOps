import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";
import { validateDispatch, claimForDispatch, DispatchConflictError } from "@/lib/rules";

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

  try {
    const updated = await prisma.$transaction(async (tx) => {
      // Re-claims vehicle and driver atomically: validateDispatch above gives
      // friendly errors, but only this guard is safe against a concurrent
      // dispatch grabbing them between the check and the update.
      await claimForDispatch(tx, trip.vehicleId, trip.driverId);
      return tx.trip.update({
        where: { id },
        data: { status: "DISPATCHED", dispatchedAt: new Date() },
      });
    });
    return ok(updated);
  } catch (err) {
    if (err instanceof DispatchConflictError) return fail(err.message, 409);
    throw err;
  }
}
