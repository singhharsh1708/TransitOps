import { prisma } from "@/lib/db";
import { ok, requireAuth } from "@/lib/api";
import { eligibleVehicleWhere, eligibleDriverWhere } from "@/lib/rules";

// Supplies only dispatch-eligible vehicles and drivers to the trip form so the
// UI can never offer an invalid selection (Retired/In Shop vehicles, expired or
// suspended drivers are excluded).
export async function GET() {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const [vehicles, drivers] = await Promise.all([
    prisma.vehicle.findMany({
      where: eligibleVehicleWhere(),
      select: { id: true, registrationNo: true, name: true, maxLoadKg: true },
      orderBy: { registrationNo: "asc" },
    }),
    prisma.driver.findMany({
      where: eligibleDriverWhere(),
      select: { id: true, name: true, licenseNo: true, safetyScore: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return ok({ vehicles, drivers });
}
