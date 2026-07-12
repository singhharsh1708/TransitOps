import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";
import { WRITE_ACCESS, type Role } from "./constants";
import { prisma } from "./db";

export function ok(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

// Ensures a valid session exists. Returns the user or an error response.
export async function requireAuth(): Promise<
  { user: SessionUser } | { error: NextResponse }
> {
  const user = await getSession();
  if (!user) return { error: fail("Not authenticated", 401) };
  return { user };
}

// Ensures the session user may write to the given resource group.
// The JWT carries the role from login time, which can be up to 12 hours
// stale, so writes re-read it from the database — a role change or a deleted
// account takes effect immediately. Reads stay on the token, since every
// role may read everything.
export async function requireWrite(
  resource: keyof typeof WRITE_ACCESS,
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;

  const dbUser = await prisma.user.findUnique({
    where: { id: auth.user.id },
    select: { role: true },
  });
  if (!dbUser) return { error: fail("Not authenticated", 401) };

  const role = dbUser.role as Role;
  const allowed = WRITE_ACCESS[resource];
  if (!allowed.includes(role)) {
    return { error: fail("Your role cannot modify this resource", 403) };
  }
  return { user: { ...auth.user, role } };
}
