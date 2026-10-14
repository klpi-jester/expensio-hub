"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getCurrentStore } from "@/lib/store-context";

export type StoreActionResult = { ok: true } | { ok: false; error: string };

// Slugs that would collide with app routes or look untrustworthy.
const RESERVED = new Set([
  "admin", "auth", "api", "menu", "order", "login", "signup",
  "onboarding", "dashboard", "settings", "store", "callback", "_next",
]);

const slugSchema = z
  .string()
  .trim()
  .min(3, "Slug must be at least 3 characters")
  .max(40, "Slug must be 40 characters or fewer")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens")
  .refine((s) => !RESERVED.has(s), "That slug is reserved, please choose another");

const createSchema = z.object({
  name: z.string().trim().min(1, "Store name is required").max(80),
  slug: slugSchema,
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

const updateSchema = createSchema.extend({
  logo_url: z.string().trim().url().optional().or(z.literal("")),
  cover_url: z.string().trim().url().optional().or(z.literal("")),
});

async function slugTaken(supabase: Awaited<ReturnType<typeof createClient>>, slug: string, exceptId?: string) {
  let q = supabase.from("stores").select("id").eq("slug", slug).maybeSingle();
  if (exceptId) q = supabase.from("stores").select("id").eq("slug", slug).neq("id", exceptId).maybeSingle();
  const { data } = await q;
  return !!data;
}

/** Create the merchant's store during onboarding (one per user). */
export async function createStore(input: {
  name: string;
  slug: string;
  description?: string;
}): Promise<StoreActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, slug, description } = parsed.data;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "You must be signed in" };

  // MVP: a merchant gets a single store.
  const existing = await getCurrentStore();
  if (existing) return { ok: false, error: "You already have a store." };

  if (await slugTaken(supabase, slug)) {
    return { ok: false, error: "That slug is already taken. Try another." };
  }

  const { error } = await supabase.from("stores").insert({
    owner_id: user.id,
    name,
    slug,
    description: description || null,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin");
  return { ok: true };
}

/** Update store profile + branding (name, slug, description, logo, cover). */
export async function updateStore(input: {
  name: string;
  slug: string;
  description?: string;
  logo_url?: string;
  cover_url?: string;
}): Promise<StoreActionResult> {
  const parsed = updateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const store = await getCurrentStore();
  if (!store) return { ok: false, error: "No store found. Complete onboarding first." };

  const { name, slug, description, logo_url, cover_url } = parsed.data;

  if (await slugTaken(supabase, slug, store.id)) {
    return { ok: false, error: "That slug is already taken. Try another." };
  }

  const { error } = await supabase
    .from("stores")
    .update({
      name,
      slug,
      description: description || null,
      logo_url: logo_url || null,
      cover_url: cover_url || null,
    })
    .eq("id", store.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/admin/store");
  revalidatePath("/menu/[storeId]", "page");
  revalidatePath(`/menu/${store.slug}`);
  return { ok: true };
}
