import { getSession } from "@/lib/auth";
import { ok, fail } from "@/lib/api";

export async function GET() {
  const user = await getSession();
  if (!user) return fail("Not authenticated", 401);
  return ok(user);
}
