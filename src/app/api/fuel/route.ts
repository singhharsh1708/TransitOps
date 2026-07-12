import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";

const createSchema = z.object({
  vehicleId: z.coerce.number().int(),
  liters: z.coerce.number().positive(),
  cost: z.coerce.number().min(0),
  odometer: z.coerce.number().min(0).default(0),
  date: z.coerce.date().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");

  const logs = await prisma.fuelLog.findMany({
    where: vehicleId ? { vehicleId: Number(vehicleId) } : {},
    include: { vehicle: true },
    orderBy: { date: "desc" },
  });
  return ok(logs);
}

export async function POST(req: Request) {
  const auth = await requireWrite("fuel");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle) return fail("Vehicle not found", 404);

  const log = await prisma.fuelLog.create({
    data: { ...parsed.data, date: parsed.data.date ?? new Date(), createdById: auth.user.id },
  });
  return ok(log, { status: 201 });
}
