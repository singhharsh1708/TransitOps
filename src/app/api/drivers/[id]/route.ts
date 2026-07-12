import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";
import { LICENSE_CATEGORIES } from "@/lib/constants";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  licenseNo: z.string().min(1).optional(),
  licenseCategory: z.enum(LICENSE_CATEGORIES as [string, ...string[]]).optional(),
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

  const current = await prisma.driver.findUnique({ where: { id } });
  if (!current) return fail("Driver not found", 404);

  // ON_TRIP is owned by the trip workflow. Flipping an On Trip driver back to
  // Available by hand would desync them from their dispatched trip, so status
  // edits wait until the trip is completed or cancelled. Sending the current
  // status back unchanged is always fine.
  const nextStatus = parsed.data.status;
  if (nextStatus && nextStatus !== current.status) {
    if (current.status === "ON_TRIP") {
      return fail("Driver is On Trip; complete or cancel the trip to change their status");
    }
    if (nextStatus === "ON_TRIP") {
      return fail("On Trip is set by dispatching a trip, not manually");
    }
  }

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
  // A driver referenced by any trip (past or present) cannot be hard-deleted
  // without violating foreign keys; block it rather than returning a 500.
  const trips = await prisma.trip.count({ where: { driverId: id } });
  if (trips > 0) {
    return fail("Cannot delete a driver with trip history; set them to Off Duty instead", 409);
  }

  await prisma.driver.delete({ where: { id } });
  return ok({ success: true });
}
