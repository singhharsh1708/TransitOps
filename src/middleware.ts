import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "insecure-dev-secret",
);

const PUBLIC_PATHS = ["/login", "/api/auth/login"];

async function isAuthed(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("transitops_session")?.value;
  if (!token) return false;
  try {
    await jwtVerify(token, secret);
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  const authed = await isAuthed(req);

  if (!authed) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  // Protect everything except Next internals, the favicon, files under
  // /images, and any request for a static asset (has a file extension).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico|css|js)).*)"],
};
