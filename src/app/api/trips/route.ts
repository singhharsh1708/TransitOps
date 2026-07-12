import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";
import { validateDispatch } from "@/lib/rules";

const createSchema = z.object({
  source: z.string().min(1),
  destination: z.string().min(1),
  vehicleId: z.coerce.number().int(),
  driverId: z.coerce.number().int(),
  cargoWeightKg: z.coerce.number().positive(),
  plannedDistance: z.coerce.number().min(0),
  revenue: z.coerce.number().min(0).default(0),
  dispatchNow: z.boolean().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const trips = await prisma.trip.findMany({
    where: status ? { status } : {},
    include: { vehicle: true, driver: true, createdBy: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
  return ok(trips);
}

export async function POST(req: Request) {
  const auth = await requireWrite("trips");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");
  const data = parsed.data;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: data.vehicleId } });
  if (!vehicle) return fail("Vehicle not found", 404);

  const driver = await prisma.driver.findUnique({ where: { id: data.driverId } });
  if (!driver) return fail("Driver not found", 404);

  // Cargo weight must not exceed capacity — checked at creation for every trip.
  if (data.cargoWeightKg > vehicle.maxLoadKg) {
    return fail(`Cargo ${data.cargoWeightKg}kg exceeds vehicle capacity ${vehicle.maxLoadKg}kg`);
  }

  // If the user asked to dispatch immediately, run the full rule set atomically.
  if (data.dispatchNow) {
    const check = await validateDispatch({
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeightKg: data.cargoWeightKg,
    });
    if (!check.ok) return fail(check.message);

    const trip = await prisma.$transaction(async (tx) => {
      const t = await tx.trip.create({
        data: {
          source: data.source,
          destination: data.destination,
          vehicleId: data.vehicleId,
          driverId: data.driverId,
          cargoWeightKg: data.cargoWeightKg,
          plannedDistance: data.plannedDistance,
          revenue: data.revenue,
          status: "DISPATCHED",
          dispatchedAt: new Date(),
          createdById: auth.user.id,
        },
      });
      await tx.vehicle.update({ where: { id: data.vehicleId }, data: { status: "ON_TRIP" } });
      await tx.driver.update({ where: { id: data.driverId }, data: { status: "ON_TRIP" } });
      return t;
    });
    return ok(trip, { status: 201 });
  }

  const trip = await prisma.trip.create({
    data: {
      source: data.source,
      destination: data.destination,
      vehicleId: data.vehicleId,
      driverId: data.driverId,
      cargoWeightKg: data.cargoWeightKg,
      plannedDistance: data.plannedDistance,
      revenue: data.revenue,
      status: "DRAFT",
      createdById: auth.user.id,
    },
  });
  return ok(trip, { status: 201 });
}
