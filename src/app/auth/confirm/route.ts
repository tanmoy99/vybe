import { NextResponse, type NextRequest } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { safeNextPath } from "@/lib/validation/auth";

const OTP_TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

/**
 * Landing point for every email link (sign-up confirmation, magic link,
 * password recovery). Supports token_hash links (our email templates; work
 * across devices) and PKCE ?code= links (Supabase default templates).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"), "/onboarding");

  const supabase = await createClient();
  let ok = false;

  if (tokenHash && type && OTP_TYPES.includes(type)) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash });
    ok = !error;
  } else if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    ok = !error;
  }

  const destination = request.nextUrl.clone();
  destination.search = "";
  if (ok) {
    destination.pathname = next;
  } else {
    destination.pathname = "/login";
    destination.searchParams.set("error", "link");
  }
  return NextResponse.redirect(destination);
}
