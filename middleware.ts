import { auth } from "@/auth";
import { neon } from "@neondatabase/serverless";
import { NextResponse } from "next/server";

export default auth(async (req) => {
  const { pathname } = req.nextUrl;
  const user = req.auth?.user;

  // Allow all auth routes through without any checks
  if (pathname.startsWith("/auth/") || pathname.startsWith("/api/auth/")) {
    return NextResponse.next();
  }

  // Public routes that don't need auth
  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/u/") || pathname === "/games" || pathname.startsWith("/games/showdle") || pathname.startsWith("/api/showdle") || pathname.startsWith("/games/name-that-song") || pathname.startsWith("/api/name-that-song");

  // Unauthenticated user on a protected route -> redirect to /games
  if (!user && !isPublicRoute) {
    const url = req.nextUrl.clone();
    url.pathname = "/games";
    return NextResponse.redirect(url);
  }

  // /login or root -> redirect to /games
  if (pathname === "/" || pathname.startsWith("/login")) {
    const url = req.nextUrl.clone();
    url.pathname = "/games";
    return NextResponse.redirect(url);
  }

  // Handle check: skip if cookie cache says handle exists
  if (
    user &&
    !pathname.startsWith("/choose-handle") &&
    !pathname.startsWith("/auth/")
  ) {
    const hasHandleCookie = req.cookies.get("x-has-handle")?.value;

    if (!hasHandleCookie) {
      try {
        const sql = neon(process.env.DATABASE_URL!);
        const rows = await sql`SELECT handle FROM profiles WHERE id = ${user.id} LIMIT 1`;

        if (rows.length === 0) {
          const url = req.nextUrl.clone();
          url.pathname = "/choose-handle";
          return NextResponse.redirect(url);
        }

        // Handle exists - cache in cookie for 5 minutes
        const response = NextResponse.next();
        response.cookies.set("x-has-handle", "1", {
          path: "/",
          maxAge: 300,
          httpOnly: true,
          sameSite: "lax",
        });
        return response;
      } catch {
        // If DB query fails, let the request through
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
