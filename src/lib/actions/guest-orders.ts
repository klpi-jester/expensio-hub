"use server";

import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateReferenceCode } from "@/lib/format";
import type { TablesInsert } from "@/lib/supabase/database.types";

type GuestOrderInsert = TablesInsert<"guest_orders">;

const orderSchema = z.object({
  store_id: z.string().uuid("Invalid store"),
  guest_name: z.string().trim().min(1, "Please enter your name"),
  guest_mobile: z.string().trim().max(30).optional().or(z.literal("")),
  guest_email: z
    .string()
    .trim()
    .email("Enter a valid email")
    .optional()
    .or(z.literal("")),
  items: z
    .array(
      z.object({
        item_id: z.string().uuid(),
        quantity: z.coerce.number().int().min(1),
      }),
    )
    .min(1, "Add at least one item"),
});

export type GuestOrderInput = z.input<typeof orderSchema>;
export type GuestOrderResult =
  | { ok: true; referenceCode: string }
  | { ok: false; error: string };

/**
 * Create a self-service guest order. Prices are read from the database; the
 * guest only submits item ids + quantities.
 */
export async function submitGuestOrder(
  input: GuestOrderInput,
): Promise<GuestOrderResult> {
  const parsed = orderSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid order" };
  }
  const { store_id, guest_name, guest_mobile, guest_email, items } = parsed.data;

  const supabase = await createClient();

  // Resolve the target store (publicly readable) so we can validate tenancy.
  const { data: store, error: storeError } = await supabase
    .from("stores")
    .select("id")
    .eq("id", store_id)
    .maybeSingle();
  if (storeError) return { ok: false, error: storeError.message };
  if (!store) return { ok: false, error: "Store not found" };

  // Authoritative pricing from this store's active items.
  const ids = items.map((i) => i.item_id);
  const { data: dbItems, error: itemsError } = await supabase
    .from("items")
    .select("id,sell_price")
    .eq("store_id", store_id)
    .eq("is_active", true)
    .in("id", ids);
  if (itemsError) return { ok: false, error: itemsError.message };

  const priceById = new Map((dbItems ?? []).map((i) => [i.id, Number(i.sell_price)]));

  let total = 0;
  const rows: { item_id: string; quantity: number; price_at_order: number }[] = [];
  for (const line of items) {
    const price = priceById.get(line.item_id);
    if (price === undefined) {
      return { ok: false, error: "One or more items are no longer available" };
    }
    total += price * line.quantity;
    rows.push({ item_id: line.item_id, quantity: line.quantity, price_at_order: price });
  }

  // Insert the order header, retrying only on a reference_code collision.
  let order: { id: string; reference_code: string } | null = null;
  let lastError: string | null = null;
  for (let attempt = 0; attempt < 5; attempt++) {
    const reference_code = generateReferenceCode(6);
    const payload: GuestOrderInsert = {
      store_id,
      reference_code,
      guest_name,
      guest_mobile: guest_mobile || null,
      guest_email: guest_email || null,
      total_amount: total,
      status: "pending",
    };
    const { data, error } = await supabase
      .from("guest_orders")
      .insert(payload)
      .select("id,reference_code")
      .single();

    if (error) {
      lastError = error.message;
      if (error.code !== "23505") return { ok: false, error: lastError };
      continue; // collision -> retry with a new code
    }
    order = data;
    break;
  }

  if (!order) {
    return { ok: false, error: lastError ?? "Could not place your order" };
  }

  // Insert the order lines.
  const { error: linesError } = await supabase.from("guest_order_items").insert(
    rows.map((r) => ({ ...r, guest_order_id: order.id })),
  );
  if (linesError) {
    await supabase.from("guest_orders").delete().eq("id", order.id); // rollback
    return { ok: false, error: linesError.message };
  }

  return { ok: true, referenceCode: order.reference_code };
}
