import { prisma } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";
import type { Role } from "@/lib/constants";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.email || !body?.password) {
    return fail("Email and password are required");
  }

  const user = await prisma.user.findUnique({ where: { email: String(body.email).toLowerCase() } });
  if (!user) return fail("Invalid credentials", 401);

  const valid = await verifyPassword(String(body.password), user.passwordHash);
  if (!valid) return fail("Invalid credentials", 401);

  await createSession({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role as Role,
  });

  return ok({ id: user.id, name: user.name, email: user.email, role: user.role });
}
