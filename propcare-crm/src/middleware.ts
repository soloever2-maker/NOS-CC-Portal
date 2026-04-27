import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// ── Simple in-memory rate limiter ─────────────────────────────────────────
const RATE_LIMIT = 60;
const WINDOW_MS  = 60_000;
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

setInterval(() => {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now > val.resetAt) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

// ── Admin-only routes ──────────────────────────────────────────────────────
const ADMIN_ONLY_ROUTES = [
  "/dashboard/sla",
  "/dashboard/kpi",
  "/dashboard/reports",
];

const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN", "MANAGER"];

// ── Middleware ─────────────────────────────────────────────────────────────
export async function middleware(request: NextRequest) {

  // ── Rate limit API routes only ─────────────────────────────────────────
  if (request.nextUrl.pathname.startsWith("/api/")) {
    const ip =
      request.headers.get("x-real-ip") ??
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please slow down." },
        { status: 429 }
      );
    }
  }

  // ── Supabase client (UNCHANGED from original) ──────────────────────────
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
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
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith("/auth") && !pathname.startsWith("/auth/callback") && !pathname.startsWith("/auth/set-password");
  const isPublicRoute = pathname === "/";

  // ── 1. UNCHANGED — Unauthenticated → login ─────────────────────────────
  if (!user && !isAuthPage && !isPublicRoute) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  // ── 2. UNCHANGED — Logged in → away from auth pages ───────────────────
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    return NextResponse.redirect(url);
  }

  // ── 3. NEW — Admin-only routes protection ──────────────────────────────
  // Only runs for 3 specific routes, zero effect on everything else
  const isAdminRoute = ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r));

  if (user && isAdminRoute) {
    try {
      const { data: profile, error } = await supabase
        .from("users")
        .select("role")
        .eq("supabase_id", user.id)
        .single();

      // If DB query fails for any reason → fail open (let through)
      // The page itself has its own fallback check
      if (!error && profile && !ADMIN_ROLES.includes(profile.role)) {
        const url = request.nextUrl.clone();
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }
    } catch {
      // Network/unexpected error → fail open, don't block anyone
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
