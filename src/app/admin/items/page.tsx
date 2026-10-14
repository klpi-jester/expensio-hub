import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { ItemsManager } from "@/components/admin/items/items-manager";
import type { Item } from "@/lib/supabase/database.types";

export default async function ItemsPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: categories }, settings] = await Promise.all([
    supabase.from("items").select("*").order("created_at", { ascending: false }),
    supabase.from("categories").select("id,name").order("name"),
    getSettings(),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Items</h1>
        <p className="text-sm text-muted-foreground">
          Manage your inventory and dishes across retail and resto modes.
        </p>
      </div>
      <ItemsManager
        items={(items as Item[]) ?? []}
        categories={categories ?? []}
        currencySymbol={settings.currency_symbol}
      />
    </div>
  );
}
