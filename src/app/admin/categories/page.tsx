import { createClient } from "@/lib/supabase/server";
import { CategoriesManager } from "@/components/admin/categories/categories-manager";
import type { Category } from "@/lib/supabase/database.types";

export default async function CategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*")
    .order("name");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Categories</h1>
        <p className="text-sm text-muted-foreground">
          Group items for the POS and the public menu.
        </p>
      </div>
      <CategoriesManager categories={(categories as Category[]) ?? []} />
    </div>
  );
}
