"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMoney } from "@/lib/format";
import {
  setGuestOrderStatus,
  convertGuestOrderToSale,
} from "@/lib/actions/guest-order-admin";
import { toast } from "sonner";
import { Radio, Check, X, Banknote, Clock } from "lucide-react";
import type { QueueOrder } from "@/lib/queue-types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  confirmed: "bg-sky-500/15 text-sky-400 border-sky-500/30",
  completed: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  cancelled: "bg-red-500/15 text-red-400 border-red-500/30",
};

export function LiveQueue({
  orders,
  currencySymbol,
}: {
  orders: QueueOrder[];
  currencySymbol: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [connected, setConnected] = useState(false);
  const [newCount, setNewCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("admin-guest-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "guest_orders" },
        (payload) => {
          // Bump a "new order" indicator on INSERT (skip the initial mount).
          if (payload.eventType === "INSERT") {
            setNewCount((c) => c + 1);
            toast.success(`New guest order: ${(payload.new as { reference_code?: string }).reference_code ?? ""}`);
          }
          router.refresh();
        },
      )
      .subscribe((status) => setConnected(status === "SUBSCRIBED"));

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);

  function act(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const res = await fn();
      if (res.ok) {
        toast.success(okMsg);
        router.refresh();
      } else {
        toast.error(res.error ?? "Action failed");
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm">
        <span
          className={
            "flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium " +
            (connected
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-muted text-muted-foreground")
          }
        >
          <Radio className="h-3 w-3" />
          {connected ? "Live" : "Connecting…"}
        </span>
        {newCount > 0 && (
          <Badge variant="secondary" onClick={() => setNewCount(0)} className="cursor-pointer">
            {newCount} new
          </Badge>
        )}
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No orders in the queue right now.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg tracking-widest">
                    {order.reference_code}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={
                      "capitalize " +
                      (STATUS_STYLES[order.status] ??
                        "bg-muted text-muted-foreground")
                    }
                  >
                    {order.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {order.guest_name}
                  {order.guest_mobile ? ` · ${order.guest_mobile}` : ""}
                </p>
              </CardHeader>
              <CardContent className="space-y-3">
                <ul className="space-y-1 text-sm">
                  {order.items.map((line, i) => (
                    <li key={i} className="flex justify-between">
                      <span>
                        {line.name} × {line.quantity}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="flex items-center justify-between border-t pt-2">
                  <span className="text-sm text-muted-foreground">
                    <Clock className="mr-1 inline h-3.5 w-3.5" />
                    {new Date(order.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="font-bold">
                    {formatMoney(order.total_amount, currencySymbol)}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {order.status === "pending" && (
                    <Button
                      size="sm"
                      disabled={pending}
                      onClick={() =>
                        act(() => setGuestOrderStatus(order.id, "confirmed"), "Order confirmed")
                      }
                    >
                      <Check className="mr-1 h-4 w-4" /> Confirm
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={pending}
                    onClick={() =>
                      act(() => convertGuestOrderToSale(order.id), "Converted to sale")
                    }
                  >
                    <Banknote className="mr-1 h-4 w-4" /> To sale
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={pending}
                    onClick={() =>
                      act(
                        () => setGuestOrderStatus(order.id, "completed"),
                        "Marked completed",
                      )
                    }
                  >
                    Complete
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    disabled={pending}
                    onClick={() =>
                      act(() => setGuestOrderStatus(order.id, "cancelled"), "Order cancelled")
                    }
                  >
                    <X className="mr-1 h-4 w-4" /> Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
