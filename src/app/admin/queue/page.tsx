import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { LiveQueue } from "@/components/admin/queue/live-queue";
import type { GuestOrder } from "@/lib/supabase/database.types";
import type { QueueOrder } from "@/lib/queue-types";

export default async function QueuePage() {
  const supabase = await createClient();

  const [{ data: orders }, settings] = await Promise.all([
    supabase
      .from("guest_orders")
      .select(
        "*, guest_order_items(quantity, items(name))",
      )
      .in("status", ["pending", "confirmed"])
      .order("created_at", { ascending: true }),
    getSettings(),
  ]);

  const queue: QueueOrder[] = ((orders as unknown as GuestOrder[]) ?? []).map((o) => {
    const raw = (o as unknown as {
      guest_order_items: { quantity: number; items: { name: string } | null }[];
    }).guest_order_items ?? [];
    return {
      ...o,
      items: raw.map((l) => ({
        name: l.items?.name ?? "Item",
        quantity: l.quantity,
      })),
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Live Order Queue</h1>
        <p className="text-sm text-muted-foreground">
          Incoming guest self-orders update here in real time.
        </p>
      </div>
      <LiveQueue orders={queue} currencySymbol={settings.currency_symbol} />
    </div>
  );
}
