"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStore } from "@/lib/store-context";

const itemSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().trim().optional().nullable(),
  mode: z.enum(["retail", "resto"], {
    message: "Mode must be 'retail' or 'resto'",
  }),
  category_id: z.string().uuid().optional().nullable(),
  description: z.string().trim().max(500).optional().nullable(),
  image_url: z.string().trim().optional().nullable(),
  buy_price: z.coerce.number().min(0, "Must be ≥ 0"),
  sell_price: z.coerce.number().min(0, "Must be ≥ 0"),
  stock_quantity: z.coerce.number().int().min(0, "Must be ≥ 0"),
  is_active: z.boolean().optional(),
});

export type ItemInput = z.input<typeof itemSchema>;
export type ActionResult = { ok: true } | { ok: false; error: string };

function revalidateAll() {
  revalidatePath("/admin/items");
  revalidatePath("/admin/pos");
  // The public /menu routes render dynamically (force-dynamic), so they always
  // read the latest active items; nothing to revalidate here.
}

export async function createItem(input: ItemInput): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const store = await requireStore();
  const supabase = await createClient();
  const { error } = await supabase.from("items").insert({
    ...parsed.data,
    store_id: store.id,
    sku: parsed.data.sku || null,
    category_id: parsed.data.category_id || null,
    description: parsed.data.description || null,
    image_url: parsed.data.image_url || null,
    is_active: parsed.data.is_active ?? true,
  });

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "SKU already exists" : error.message,
    };
  }

  revalidateAll();
  return { ok: true };
}

export async function updateItem(
  id: string,
  input: ItemInput,
): Promise<ActionResult> {
  const parsed = itemSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({
      ...parsed.data,
      sku: parsed.data.sku || null,
      category_id: parsed.data.category_id || null,
      description: parsed.data.description || null,
      image_url: parsed.data.image_url || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "SKU already exists" : error.message,
    };
  }

  revalidateAll();
  return { ok: true };
}

export async function deleteItem(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("items").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true };
}

export async function toggleItemActive(
  id: string,
  isActive: boolean,
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("items")
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidateAll();
  return { ok: true };
}
