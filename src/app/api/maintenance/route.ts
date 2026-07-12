import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  cost: z.coerce.number().min(0).default(0),
  vehicleId: z.coerce.number().int(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;

  const records = await prisma.maintenance.findMany({
    where: status ? { status } : {},
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(records);
}

export async function POST(req: Request) {
  const auth = await requireWrite("maintenance");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle) return fail("Vehicle not found", 404);
  if (vehicle.status === "ON_TRIP") {
    return fail("Vehicle is On Trip; complete or cancel the trip first");
  }
  if (vehicle.status === "RETIRED") {
    return fail("Vehicle is Retired");
  }

  // Opening a maintenance record moves the vehicle to In Shop, removing it from
  // the dispatch pool.
  const record = await prisma.$transaction(async (tx) => {
    const m = await tx.maintenance.create({
      data: { ...parsed.data, status: "OPEN", createdById: auth.user.id },
    });
    await tx.vehicle.update({ where: { id: parsed.data.vehicleId }, data: { status: "IN_SHOP" } });
    return m;
  });

  return ok(record, { status: 201 });
}
