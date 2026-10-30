import { createBrowserClient } from "@supabase/ssr";
import { supabasePublicEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/database.types";

/** Browser client (publishable key only). Used for Realtime and client-side reads under RLS. */
export function createClient() {
  const { url, key } = supabasePublicEnv();
  return createBrowserClient<Database>(url, key);
}
