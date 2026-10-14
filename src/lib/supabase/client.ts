import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/supabase/database.types";
import { getSupabaseKey, getSupabaseUrl } from "@/lib/supabase/env";

/**
 * Client-side (browser) Supabase client for React Client Components.
 */
export function createClient() {
  return createBrowserClient<Database>(getSupabaseUrl(), getSupabaseKey());
}
