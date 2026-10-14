"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import type { ActionResult } from "@/lib/actions/items";

const settingsSchema = z.object({
  store_name: z.string().trim().min(1, "Store name is required"),
  currency_code: z.string().trim().length(3, "Use a 3-letter code").toUpperCase(),
  currency_symbol: z.string().trim().min(1, "Symbol is required").max(4),
});

export async function updateSettings(input: {
  store_name: string;
  currency_code: string;
  currency_symbol: string;
}): Promise<ActionResult> {
  const parsed = settingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid data" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("settings")
    .upsert(
      { id: 1, ...parsed.data, updated_at: new Date().toISOString() },
      { onConflict: "id" },
    );

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/settings");
  revalidatePath("/admin", "layout");
  return { ok: true };
}
