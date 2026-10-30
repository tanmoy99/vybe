import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { supabasePublicEnv } from "@/lib/env";

const PROTECTED_PREFIXES = ["/onboarding", "/universe", "/radar", "/worlds", "/connections", "/me", "/settings", "/admin"];
const AUTH_PAGES = ["/login", "/signup"];

/**
 * Refreshes the Supabase session cookie on every matched request and performs
 * optimistic redirects. This is NOT the authorisation boundary: every page and
 * server action re-checks the user through the DAL (src/lib/auth/dal.ts).
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const { url, key } = supabasePublicEnv();

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers).forEach(([header, value]) => response.headers.set(header, value));
      },
    },
  });

  // Do not run code between createServerClient and getClaims(): it validates the
  // JWT and refreshes an expired session.
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims?.sub);
  const { pathname } = request.nextUrl;

  if (!signedIn && PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = `?next=${encodeURIComponent(pathname)}`;
    return withCookies(NextResponse.redirect(loginUrl), response);
  }

  if (signedIn && AUTH_PAGES.includes(pathname)) {
    const home = request.nextUrl.clone();
    home.pathname = "/universe";
    home.search = "";
    return withCookies(NextResponse.redirect(home), response);
  }

  return response;
}

function withCookies(target: NextResponse, source: NextResponse) {
  source.cookies.getAll().forEach((cookie) => target.cookies.set(cookie));
  return target;
}
