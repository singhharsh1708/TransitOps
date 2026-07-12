import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";

const createSchema = z.object({
  name: z.string().min(1),
  licenseNo: z.string().min(1),
  licenseCategory: z.string().min(1),
  licenseExpiry: z.coerce.date(),
  contactNo: z.string().min(1),
  safetyScore: z.coerce.number().min(0).max(100).default(100),
  status: z.enum(["AVAILABLE", "ON_TRIP", "OFF_DUTY", "SUSPENDED"]).default("AVAILABLE"),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") ?? undefined;
  const q = searchParams.get("q") ?? undefined;

  const drivers = await prisma.driver.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? { OR: [{ name: { contains: q } }, { licenseNo: { contains: q } }] }
        : {}),
    },
    orderBy: { createdAt: "desc" },
  });
  return ok(drivers);
}

export async function POST(req: Request) {
  const auth = await requireWrite("drivers");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const existing = await prisma.driver.findUnique({
    where: { licenseNo: parsed.data.licenseNo },
  });
  if (existing) return fail("License number must be unique", 409);

  const driver = await prisma.driver.create({ data: parsed.data });
  return ok(driver, { status: 201 });
}
