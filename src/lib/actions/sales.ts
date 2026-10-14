"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStore } from "@/lib/store-context";

const checkoutSchema = z.array(
  z.object({
    item_id: z.string().uuid(),
    quantity: z.coerce.number().int().min(1),
  }),
);

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutResult =
  | { ok: true; saleId: string; totalRevenue: number; totalProfit: number }
  | { ok: false; error: string };

/**
 * Record a completed POS sale. Prices, categories and stock are read from the
 * database (never trusted from the client) and totals are recomputed here.
 */
export async function checkout(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid cart" };
  }
  const requested = parsed.data;
  if (requested.length === 0) return { ok: false, error: "Cart is empty" };

  const supabase = await createClient();

  // Load authoritative item data.
  const ids = requested.map((r) => r.item_id);
  const { data: items, error: itemsError } = await supabase
    .from("items")
    .select("id,name,mode,category_id,buy_price,sell_price,stock_quantity")
    .in("id", ids);

  if (itemsError) return { ok: false, error: itemsError.message };

  const itemsById = new Map((items ?? []).map((i) => [i.id, i]));

  // Validate stock and compute totals + line rows.
  let totalRevenue = 0;
  let totalCost = 0;
  const rows: {
    item_id: string;
    category_id: string | null;
    quantity: number;
    buy_price_at_sale: number;
    sell_price_at_sale: number;
  }[] = [];

  for (const line of requested) {
    const item = itemsById.get(line.item_id);
    if (!item) return { ok: false, error: "One or more items no longer exist" };
    if (item.stock_quantity > 0 && line.quantity > item.stock_quantity) {
      return { ok: false, error: `Insufficient stock for ${item.name}` };
    }
    totalRevenue += item.sell_price * line.quantity;
    totalCost += item.buy_price * line.quantity;
    rows.push({
      item_id: item.id,
      category_id: item.category_id,
      quantity: line.quantity,
      buy_price_at_sale: item.buy_price,
      sell_price_at_sale: item.sell_price,
    });
  }

  // Create the sale header (tenant-scoped).
  const store = await requireStore();
  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      store_id: store.id,
      total_revenue: totalRevenue,
      total_cost: totalCost,
    })
    .select("id")
    .single();

  if (saleError || !sale) {
    return { ok: false, error: saleError?.message ?? "Could not create sale" };
  }

  // Create the sale lines.
  const { error: linesError } = await supabase.from("sale_items").insert(
    rows.map((r) => ({ ...r, sale_id: sale.id })),
  );

  if (linesError) {
    await supabase.from("sales").delete().eq("id", sale.id); // rollback
    return { ok: false, error: linesError.message };
  }

  // Decrement stock for each sold item.
  for (const r of rows) {
    const item = itemsById.get(r.item_id)!;
    const nextStock = item.stock_quantity > 0
      ? Math.max(0, item.stock_quantity - r.quantity)
      : 0;
    await supabase
      .from("items")
      .update({ stock_quantity: nextStock, updated_at: new Date().toISOString() })
      .eq("id", r.item_id);
  }

  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/pos");
  revalidatePath("/admin/items");

  return {
    ok: true,
    saleId: sale.id,
    totalRevenue,
    totalProfit: totalRevenue - totalCost,
  };
}
