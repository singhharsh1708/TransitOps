import { NextResponse } from "next/server";
import { getSession, type SessionUser } from "./auth";
import { WRITE_ACCESS, type Role } from "./constants";

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
export async function requireWrite(
  resource: keyof typeof WRITE_ACCESS,
): Promise<{ user: SessionUser } | { error: NextResponse }> {
  const auth = await requireAuth();
  if ("error" in auth) return auth;
  const allowed = WRITE_ACCESS[resource];
  if (!allowed.includes(auth.user.role as Role)) {
    return { error: fail("Your role cannot modify this resource", 403) };
  }
  return { user: auth.user };
}
