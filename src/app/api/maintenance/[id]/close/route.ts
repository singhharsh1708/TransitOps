import { prisma } from "@/lib/db";
import { ok, fail, requireWrite } from "@/lib/api";

export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const auth = await requireWrite("maintenance");
  if ("error" in auth) return auth.error;

  const id = Number(params.id);
  const record = await prisma.maintenance.findUnique({ where: { id }, include: { vehicle: true } });
  if (!record) return fail("Maintenance record not found", 404);
  if (record.status === "CLOSED") return fail("Maintenance is already closed");

  const updated = await prisma.$transaction(async (tx) => {
    const m = await tx.maintenance.update({
      where: { id },
      data: { status: "CLOSED", closedAt: new Date() },
    });
    // Closing maintenance restores the vehicle to Available unless it is retired.
    if (record.vehicle.status !== "RETIRED") {
      await tx.vehicle.update({ where: { id: record.vehicleId }, data: { status: "AVAILABLE" } });
    }
    return m;
  });

  return ok(updated);
}
