import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { GuestOrderFlow } from "@/components/menu/guest-order-flow";
import type { Item, Category, Store } from "@/lib/supabase/database.types";

// Public menu reads live data (cookies + database) on every request.
export const instant = false;

type MenuItem = Item & { category_name: string | null };

/** Resolve a store by its public slug (case-insensitive). */
async function loadStore(slug: string): Promise<Store | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("stores")
    .select("*")
    .ilike("slug", slug)
    .maybeSingle();
  return data ?? null;
}

async function loadMenu(storeId: string) {
  // Public read of this store's live menu. The anonymous server client runs
  // with the `anon` role, so the menu RLS policies apply.
  const supabase = await createClient();
  const [{ data: items }, { data: categories }] = await Promise.all([
    supabase
      .from("items")
      .select("*")
      .eq("store_id", storeId)
      .eq("is_active", true)
      .order("name"),
    supabase.from("categories").select("id,name").eq("store_id", storeId),
  ]);

  const catById = new Map(
    ((categories as Pick<Category, "id" | "name">[]) ?? []).map((c) => [c.id, c.name]),
  );
  const menu: MenuItem[] = ((items as Item[]) ?? []).map((i) => ({
    ...i,
    category_name: i.category_id ? catById.get(i.category_id) ?? null : null,
  }));
  return menu;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ storeId: string }>;
}): Promise<Metadata> {
  const { storeId } = await params;
  const store = await loadStore(storeId);
  const name = store?.name ?? "Menu";
  return {
    title: `Menu · ${name}`,
    description: store?.description ?? undefined,
  };
}

export default async function MenuPage({
  params,
  searchParams,
}: {
  params: Promise<{ storeId: string }>;
  searchParams: Promise<{ table?: string }>;
}) {
  const { storeId } = await params;
  const { table } = await searchParams;
  if (!storeId) notFound();

  // The [storeId] segment is the store's public slug.
  const store = await loadStore(storeId);
  if (!store) notFound();

  const [menu, settings] = await Promise.all([loadMenu(store.id), getSettings()]);

  return (
    <main className="min-h-screen bg-background">
      <GuestOrderFlow
        storeId={store.id}
        storeSlug={store.slug}
        storeName={store.name}
        storeDescription={store.description}
        storeLogoUrl={store.logo_url}
        storeCoverUrl={store.cover_url}
        currencySymbol={settings.currency_symbol}
        tableLabel={table}
        items={menu}
      />
    </main>
  );
}
