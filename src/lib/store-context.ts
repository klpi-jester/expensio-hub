import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Store } from "@/lib/supabase/database.types";

/** Returns the signed-in merchant's store, or null if they have none yet. */
export async function getCurrentStore(): Promise<Store | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("stores")
    .select("*")
    .eq("owner_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data ?? null;
}

/**
 * Guard for tenant-scoped admin pages: resolves the store, or redirects a
 * first-time merchant to the Create Store onboarding screen.
 */
export async function requireStore(): Promise<Store> {
  const store = await getCurrentStore();
  if (!store) redirect("/admin/onboarding");
  return store;
}
