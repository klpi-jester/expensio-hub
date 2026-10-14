"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { GuestOrderStatus } from "@/lib/supabase/database.types";

const STEPS: { key: GuestOrderStatus; label: string }[] = [
  { key: "pending", label: "Pending" },
  { key: "confirmed", label: "Confirmed" },
  { key: "completed", label: "Ready / Completed" },
];

export function OrderStatusTracker({
  orderId,
  initialStatus,
}: {
  orderId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState<GuestOrderStatus>(
    (initialStatus as GuestOrderStatus) ?? "pending",
  );

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`guest-order-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "guest_orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const next = (payload.new as { status?: string }).status;
          if (next) setStatus(next as GuestOrderStatus);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orderId]);

  if (status === "cancelled") {
    return (
      <Card className="border-destructive/40">
        <CardContent className="pt-6">
          <p className="text-center font-semibold text-destructive">
            This order was cancelled. Please contact staff.
          </p>
        </CardContent>
      </Card>
    );
  }

  const activeIndex = STEPS.findIndex((s) => s.key === status);

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <p className="text-sm font-semibold">Live status</p>
        <div className="flex items-center">
          {STEPS.map((step, i) => (
            <div key={step.key} className="flex flex-1 items-center last:flex-none">
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                    i <= activeIndex
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {i + 1}
                </div>
                <span className="whitespace-nowrap text-xs">{step.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    i < activeIndex ? "bg-primary" : "bg-muted",
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground">
          This page updates automatically as the merchant progresses your order.
        </p>
      </CardContent>
    </Card>
  );
}
