"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/items";

const statusSchema = z.enum(["pending", "confirmed", "completed", "cancelled"]);

/** Update a guest order's status (used by the live queue). */
export async function setGuestOrderStatus(
  id: string,
  status: string,
): Promise<ActionResult> {
  const parsed = statusSchema.safeParse(status);
  if (!parsed.success) return { ok: false, error: "Invalid status" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("guest_orders")
    .update({ status: parsed.data, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/queue");
  return { ok: true };
}

/** Convert a completed guest order into a recorded sale (and reduce stock). */
export async function convertGuestOrderToSale(id: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: order, error: orderError } = await supabase
    .from("guest_orders")
    .select("id,status,store_id")
    .eq("id", id)
    .single();
  if (orderError || !order) {
    return { ok: false, error: orderError?.message ?? "Order not found" };
  }

  // Load the order lines with authoritative item buy prices.
  const { data: lines, error: linesError } = await supabase
    .from("guest_order_items")
    .select("item_id,quantity,price_at_order, items(buy_price,category_id,stock_quantity)")
    .eq("guest_order_id", id);
  if (linesError) return { ok: false, error: linesError.message };
  if (!lines || lines.length === 0) return { ok: false, error: "Order has no items" };

  type Line = {
    item_id: string;
    quantity: number;
    price_at_order: number;
    items: {
      buy_price: number;
      category_id: string | null;
      stock_quantity: number;
    } | null;
  };
  const rows = lines as unknown as Line[];

  let totalRevenue = 0;
  let totalCost = 0;
  const saleRows: {
    item_id: string;
    category_id: string | null;
    quantity: number;
    buy_price_at_sale: number;
    sell_price_at_sale: number;
  }[] = [];

  for (const line of rows) {
    const item = line.items;
    if (!item) return { ok: false, error: "An item in this order no longer exists" };
    totalRevenue += line.price_at_order * line.quantity;
    totalCost += item.buy_price * line.quantity;
    saleRows.push({
      item_id: line.item_id,
      category_id: item.category_id,
      quantity: line.quantity,
      buy_price_at_sale: item.buy_price,
      sell_price_at_sale: line.price_at_order,
    });
  }

  const { data: sale, error: saleError } = await supabase
    .from("sales")
    .insert({
      store_id: order.store_id,
      total_revenue: totalRevenue,
      total_cost: totalCost,
    })
    .select("id")
    .single();
  if (saleError || !sale) {
    return { ok: false, error: saleError?.message ?? "Could not create sale" };
  }

  const { error: insertLinesError } = await supabase
    .from("sale_items")
    .insert(saleRows.map((r) => ({ ...r, sale_id: sale.id })));
  if (insertLinesError) {
    await supabase.from("sales").delete().eq("id", sale.id);
    return { ok: false, error: insertLinesError.message };
  }

  // Reduce stock.
  for (const line of rows) {
    const item = line.items!;
    const next = item.stock_quantity > 0
      ? Math.max(0, item.stock_quantity - line.quantity)
      : 0;
    await supabase
      .from("items")
      .update({ stock_quantity: next, updated_at: new Date().toISOString() })
      .eq("id", line.item_id);
  }

  // Mark the guest order completed.
  await supabase
    .from("guest_orders")
    .update({ status: "completed", updated_at: new Date().toISOString() })
    .eq("id", id);

  revalidatePath("/admin/queue");
  revalidatePath("/admin/dashboard");
  revalidatePath("/admin/items");
  return { ok: true };
}
