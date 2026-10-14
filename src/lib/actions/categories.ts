"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStore } from "@/lib/store-context";
import type { ActionResult } from "@/lib/actions/items";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
});

export async function createCategory(name: string): Promise<ActionResult> {
  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const store = await requireStore();
  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .insert({ name: parsed.data.name, store_id: store.id });

  if (error) {
    return {
      ok: false,
      error: error.code === "23505" ? "Category already exists" : error.message,
    };
  }

  revalidatePath("/admin/categories");
  revalidatePath("/admin/items");
  return { ok: true };
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<ActionResult> {
  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("categories")
    .update({ name: parsed.data.name })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/items");
  return { ok: true };
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/admin/items");
  return { ok: true };
}
