import type { GuestOrder } from "@/lib/supabase/database.types";

/** A guest order enriched with its item lines for the live queue UI. */
export type QueueOrder = GuestOrder & {
  items: { name: string; quantity: number }[];
};
