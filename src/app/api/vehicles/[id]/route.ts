import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";

const updateSchema = z.object({
  registrationNo: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  type: z.string().min(1).optional(),
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
  const activeTrip = await prisma.trip.findFirst({
    where: { vehicleId: id, status: { in: ["DRAFT", "DISPATCHED"] } },
  });
  if (activeTrip) return fail("Cannot delete a vehicle with active trips", 409);

  await prisma.vehicle.delete({ where: { id } });
  return ok({ success: true });
}
