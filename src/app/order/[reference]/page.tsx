import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { formatMoney } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { OrderStatusTracker } from "@/components/order/order-status-tracker";
import { OrderQrCode } from "@/components/order/order-qr-code";
import type {
  GuestOrder,
  GuestOrderItem,
} from "@/lib/supabase/database.types";

// Confirmation page reads live order data on every request.
export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ reference: string }>;
}): Promise<Metadata> {
  const { reference } = await params;
  return { title: `Order ${reference} · Expensio Dine` };
}

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ reference: string }>;
}) {
  const { reference } = await params;
  const supabase = await createClient();

  const [{ data: order }, settings] = await Promise.all([
    supabase
      .from("guest_orders")
      .select("*")
      .eq("reference_code", reference.toUpperCase())
      .maybeSingle(),
    getSettings(),
  ]);

  if (!order) notFound();
  const guestOrder = order as GuestOrder;

  const { data: itemsData } = await supabase
    .from("guest_order_items")
    .select("id,item_id,quantity,price_at_order,subtotal, items(name)")
    .eq("guest_order_id", guestOrder.id);

  const items = (itemsData as (GuestOrderItem & { items: { name: string } | null })[]) ?? [];

  const trackingUrl = `${(process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "")}/order/${guestOrder.reference_code}`;

  return (
    <main className="min-h-screen bg-muted/30">
      <div className="mx-auto max-w-md space-y-4 p-4">
        <Card className="text-center">
          <CardContent className="space-y-4 pt-6">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              ✓
            </div>
            <div>
              <h1 className="text-xl font-bold">Order placed!</h1>
              <p className="text-sm text-muted-foreground">
                Thanks {guestOrder.guest_name}, here’s your reference.
              </p>
            </div>

            <div className="rounded-lg border bg-background p-4">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                Reference number
              </p>
              <p className="text-3xl font-extrabold tracking-widest">
                {guestOrder.reference_code}
              </p>
            </div>

            <OrderQrCode value={trackingUrl} className="mx-auto" />
            <p className="text-xs text-muted-foreground">
              Scan to track your order status.
            </p>
          </CardContent>
        </Card>

        <OrderStatusTracker
          orderId={guestOrder.id}
          initialStatus={guestOrder.status}
        />

        <Card>
          <CardContent className="space-y-3 pt-6">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Your order</h2>
              <Badge variant="secondary">{settings.currency_code}</Badge>
            </div>
            <ul className="space-y-2 text-sm">
              {items.map((line) => (
                <li key={line.id} className="flex justify-between">
                  <span>
                    {line.items?.name ?? "Item"} × {line.quantity}
                  </span>
                  <span>
                    {formatMoney(line.subtotal ?? Number(line.price_at_order) * line.quantity, settings.currency_symbol)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="flex items-center justify-between border-t pt-3 font-bold">
              <span>Total</span>
              <span>{formatMoney(guestOrder.total_amount, settings.currency_symbol)}</span>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Link href={`/menu/${settings.store_name.toLowerCase().replace(/\s+/g, "-")}`}>
            <Button variant="outline">Back to menu</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
