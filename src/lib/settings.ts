import { createClient } from "@/lib/supabase/server";
import type { Setting } from "@/lib/supabase/database.types";

// Static fallback used only when the settings row is missing/erroring. Kept as
// a fixed value (not new Date()) so it never introduces an unstable value that
// would break prerendering under cacheComponents.
const FALLBACK_SETTINGS: Setting = {
  id: 1,
  currency_code: "PHP",
  currency_symbol: "₱",
  store_name: "Expensio Dine",
  updated_at: "1970-01-01T00:00:00.000Z",
};

/** Read the single-row global settings (currency, store name). */
export async function getSettings(): Promise<Setting> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) return FALLBACK_SETTINGS;
  return data;
}
