"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { updateSettings } from "@/lib/actions/settings";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";

const PRESETS = [
  { code: "PHP", symbol: "₱" },
  { code: "USD", symbol: "$" },
  { code: "EUR", symbol: "€" },
  { code: "GBP", symbol: "£" },
  { code: "IDR", symbol: "Rp" },
  { code: "MYR", symbol: "RM" },
];

type Initial = {
  store_name: string;
  currency_code: string;
  currency_symbol: string;
};

export function SettingsForm({ initial }: { initial: Initial }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<Initial>(initial);

  function save() {
    startTransition(async () => {
      const res = await updateSettings(form);
      if (res.ok) {
        toast.success("Settings saved");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="grid gap-2">
          <Label htmlFor="store_name">Store name</Label>
          <Input
            id="store_name"
            value={form.store_name}
            onChange={(e) => setForm({ ...form, store_name: e.target.value })}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="code">Currency code</Label>
            <Input
              id="code"
              maxLength={3}
              value={form.currency_code}
              onChange={(e) =>
                setForm({ ...form, currency_code: e.target.value.toUpperCase() })
              }
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="symbol">Currency symbol</Label>
            <Input
              id="symbol"
              maxLength={4}
              value={form.currency_symbol}
              onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.code}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setForm({ ...form, currency_code: p.code, currency_symbol: p.symbol })}
            >
              {p.code} {p.symbol}
            </Button>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          Preview: {formatMoney(1234.5, form.currency_symbol || "₱")}
        </p>

        <div className="flex justify-end">
          <Button onClick={save} disabled={pending}>
            {pending ? "Saving…" : "Save settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
