import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";
import { VEHICLE_TYPES } from "@/lib/constants";

const createSchema = z.object({
  registrationNo: z.string().min(1),
  name: z.string().min(1),
  type: z.enum(VEHICLE_TYPES as [string, ...string[]]),
  maxLoadKg: z.coerce.number().positive(),
  odometer: z.coerce.number().min(0).default(0),
  acquisitionCost: z.coerce.number().min(0).default(0),
  region: z.string().default("General"),
  // ON_TRIP and IN_SHOP are set by the trip and maintenance workflows; a new
  // vehicle has neither, so only these two make sense at registration.
  status: z.enum(["AVAILABLE", "RETIRED"]).default("AVAILABLE"),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const type = searchParams.get("type") ?? undefined;
  const region = searchParams.get("region") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const vehicles = await prisma.vehicle.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(type ? { type } : {}),
      ...(region ? { region } : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, { registrationNo: { contains: q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(vehicles);
}

export async function POST(req: Request) {
  const auth = await requireWrite("vehicles");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.vehicle.findUnique({
    where: { registrationNo: parsed.data.registrationNo },
  });
  if (existing) return fail("Registration number must be unique", 409);

  const vehicle = await prisma.vehicle.create({ data: parsed.data });
  return ok(vehicle, { status: 201 });
}
