import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  licenseCategory: z.string().min(1).optional(),
  licenseExpiry: z.coerce.date().optional(),
  contactNo: z.string().min(1).optional(),
  safetyScore: z.coerce.number().min(0).max(100).optional(),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("drivers");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const parsed = updateSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  if (parsed.data.licenseNo) {
    const dup = await prisma.driver.findFirst({
      where: { licenseNo: parsed.data.licenseNo, NOT: { id } },
    });
    if (dup) return fail("License number must be unique", 409);
  }

  const driver = await prisma.driver.update({ where: { id }, data: parsed.data });
  return ok(driver);
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("drivers");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const activeTrip = await prisma.trip.findFirst({
    where: { driverId: id, status: { in: ["DRAFT", "DISPATCHED"] } },
  });
  if (activeTrip) return fail("Cannot delete a driver with active trips", 409);

  await prisma.driver.delete({ where: { id } });
  return ok({ success: true });
}
