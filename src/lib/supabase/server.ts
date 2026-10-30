import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { supabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/**
 * User-scoped Supabase client for Server Components, Server Actions and Route
 * Handlers. Every query runs as the signed-in user, so RLS applies.
 * Reads cookies(), so callers must sit behind a <Suspense> boundary.
 */
export async function createClient() {
  const cookieStore = await cookies();
  const { url, key } = supabasePublicEnv();

  return createServerClient<Database>(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; proxy.ts refreshes the session instead.
        }
      },
    },
  });
}
