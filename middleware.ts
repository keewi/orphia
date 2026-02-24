import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Guard: if env vars are missing, let the request through instead of crashing
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  // Allow all auth routes through without any checks
  if (request.nextUrl.pathname.startsWith("/auth/")) {
    return NextResponse.next();
  }

  // Public routes that don't need auth — skip session refresh entirely
  const pathname = request.nextUrl.pathname;
  const isPublicRoute =
    pathname.startsWith("/login") || pathname.startsWith("/u/");

  try {
    let supabaseResponse = NextResponse.next({ request });

    const supabase = createServerClient(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    });

    // Refresh the auth session (important for Server Components)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Unauthenticated user on a protected route → redirect to /login
    if (!user && !isPublicRoute) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }

    // Authenticated user on /login → redirect to home
    if (user && pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }

    // Handle check: skip if cookie cache says handle exists
    if (
      user &&
      !pathname.startsWith("/choose-handle") &&
      !pathname.startsWith("/auth/")
    ) {
      const hasHandleCookie = request.cookies.get("x-has-handle")?.value;

      if (!hasHandleCookie) {
        // No cache — query the database
        const { data: profile } = await supabase
          .from("profiles")
          .select("handle")
          .eq("id", user.id)
          .maybeSingle();

        if (!profile) {
          const url = request.nextUrl.clone();
          url.pathname = "/choose-handle";
          return NextResponse.redirect(url);
        }

        // Handle exists — cache in cookie for 5 minutes
        supabaseResponse.cookies.set("x-has-handle", "1", {
          path: "/",
          maxAge: 300,
          httpOnly: true,
          sameSite: "lax",
        });
      }
    }

    return supabaseResponse;
  } catch {
    // If anything fails, let the request through rather than crashing the site
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
