import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { PosTerminal } from "@/components/pos/pos-terminal";
import type { Item, Category } from "@/lib/supabase/database.types";

// Always render the POS at request time (live inventory + auth). Under
// cacheComponents, `force-dynamic`/`revalidate = 0` are rejected, so use
// `instant = false` + `await connection()` instead.
export const instant = false;

export default async function PosPage() {
  await connection();
  const supabase = await createClient();

  const [{ data: items }, { data: categories }, settings] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("id,name").order("name"),
    getSettings(),
  ]);

  return (
    <PosTerminal
      items={(items as Item[]) ?? []}
      categories={(categories as Pick<Category, "id" | "name">[]) ?? []}
      currencySymbol={settings.currency_symbol}
    />
  );
}
