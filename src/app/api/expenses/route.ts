import { z } from "zod";
import { prisma } from "@/lib/db";
import { ok, fail, requireAuth, requireWrite } from "@/lib/api";
import { EXPENSE_CATEGORIES } from "@/lib/constants";

const createSchema = z.object({
  vehicleId: z.coerce.number().int(),
  category: z.enum(EXPENSE_CATEGORIES as [string, ...string[]]),
  amount: z.coerce.number().positive(),
  note: z.string().default(""),
  date: z.coerce.date().optional(),
});

export async function GET(req: Request) {
  const auth = await requireAuth();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId");

  const expenses = await prisma.expense.findMany({
    where: vehicleId ? { vehicleId: Number(vehicleId) } : {},
    include: { vehicle: true },
    orderBy: { date: "desc" },
  });
  return ok(expenses);
}

export async function POST(req: Request) {
  const auth = await requireWrite("expenses");
  if ("error" in auth) return auth.error;

  const parsed = createSchema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Invalid input");

  const vehicle = await prisma.vehicle.findUnique({ where: { id: parsed.data.vehicleId } });
  if (!vehicle) return fail("Vehicle not found", 404);

  const expense = await prisma.expense.create({
    data: { ...parsed.data, date: parsed.data.date ?? new Date(), createdById: auth.user.id },
  });
  return ok(expense, { status: 201 });
}
