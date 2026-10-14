"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useGuestCart, guestTotals } from "@/lib/stores/guest-cart";
import { submitGuestOrder } from "@/lib/actions/guest-orders";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import {
  Minus,
  Plus,
  ShoppingBag,
  ArrowLeft,
  UtensilsCrossed,
  Check,
} from "lucide-react";
import type { Item } from "@/lib/supabase/database.types";

type MenuItem = Item & { category_name: string | null };

export function GuestOrderFlow({
  storeId,
  storeSlug,
  storeName,
  storeDescription,
  storeLogoUrl,
  storeCoverUrl,
  currencySymbol,
  tableLabel,
  items,
}: {
  storeId: string;
  storeSlug: string;
  storeName: string;
  storeDescription?: string | null;
  storeLogoUrl?: string | null;
  storeCoverUrl?: string | null;
  currencySymbol: string;
  tableLabel?: string | null;
  items: MenuItem[];
}) {
  const router = useRouter();
  const [step, setStep] = useState<0 | 1>(0); // 0 = info, 1 = menu (2 = confirmation page)
  const [guest, setGuest] = useState({ name: "", mobile: "", email: "" });
  const [submitting, setSubmitting] = useState(false);

  const lines = useGuestCart((s) => s.lines);
  const add = useGuestCart((s) => s.add);
  const inc = useGuestCart((s) => s.inc);
  const dec = useGuestCart((s) => s.dec);
  const remove = useGuestCart((s) => s.remove);
  const clear = useGuestCart((s) => s.clear);

  const cartLines = useMemo(() => Object.values(lines), [lines]);
  const totals = useMemo(() => guestTotals(cartLines), [cartLines]);

  const grouped = useMemo(() => {
    const map = new Map<string, MenuItem[]>();
    for (const item of items) {
      const key = item.category_name ?? "More";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(item);
    }
    return Array.from(map.entries());
  }, [items]);

  function startMenu() {
    if (!guest.name.trim()) {
      toast.error("Please enter your name");
      return;
    }
    setStep(1);
  }

  async function placeOrder() {
    if (cartLines.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    setSubmitting(true);
    const res = await submitGuestOrder({
      store_id: storeId,
      guest_name: guest.name.trim(),
      guest_mobile: guest.mobile.trim(),
      guest_email: guest.email.trim(),
      items: cartLines.map((l) => ({ item_id: l.item_id, quantity: l.quantity })),
    });
    setSubmitting(false);

    if (res.ok) {
      clear();
      router.push(`/order/${res.referenceCode}`);
    } else {
      toast.error(res.error);
    }
  }

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-background pb-28">
      {/* ===== Hero banner ===== */}
      <header className="relative">
        <div className="relative h-44 w-full overflow-hidden bg-gradient-to-br from-primary/30 via-slate-700 to-background">
          {storeCoverUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={storeCoverUrl} alt="" className="h-full w-full object-cover" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/10" />
          {step === 1 && (
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-3 top-3 bg-black/30 text-white hover:bg-black/50"
              onClick={() => setStep(0)}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          {tableLabel && (
            <Badge className="absolute right-3 top-3 bg-primary text-primary-foreground shadow">
              Table {tableLabel}
            </Badge>
          )}
        </div>

        {/* Profile */}
        <div className="px-4">
          <div className="-mt-10 flex items-end gap-3">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-background bg-card shadow-lg">
              {storeLogoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={storeLogoUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <UtensilsCrossed className="h-8 w-8 text-primary" />
              )}
            </div>
            <div className="pb-1">
              <h1 className="text-xl font-bold leading-tight">{storeName}</h1>
              <p className="text-xs text-primary">/menu/{storeSlug}</p>
              {storeDescription && (
                <p className="text-sm text-muted-foreground">{storeDescription}</p>
              )}
            </div>
          </div>

          <StepWizard current={step} />
        </div>
      </header>

      {/* ===== Body ===== */}
      {step === 0 ? (
        <section className="space-y-4 p-4 pt-5">
          <Card>
            <CardContent className="space-y-4 pt-6">
              <div>
                <h2 className="text-lg font-semibold">Let’s get you started</h2>
                <p className="text-sm text-muted-foreground">
                  Tell us who’s ordering so we can notify you when it’s ready.
                </p>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gname">Name *</Label>
                <Input
                  id="gname"
                  value={guest.name}
                  onChange={(e) => setGuest({ ...guest, name: e.target.value })}
                  placeholder="Your name"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gmobile">Mobile number</Label>
                <Input
                  id="gmobile"
                  inputMode="tel"
                  value={guest.mobile}
                  onChange={(e) => setGuest({ ...guest, mobile: e.target.value })}
                  placeholder="e.g. 0917 000 0000"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="gemail">Email</Label>
                <Input
                  id="gemail"
                  type="email"
                  value={guest.email}
                  onChange={(e) => setGuest({ ...guest, email: e.target.value })}
                  placeholder="you@example.com"
                />
              </div>
              <Button className="w-full" size="lg" onClick={startMenu}>
                Browse the menu
              </Button>
            </CardContent>
          </Card>
        </section>
      ) : (
        <section className="space-y-6 p-4 pt-5">
          {items.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">
              The menu is currently empty. Please check back soon.
            </p>
          )}
          {grouped.map(([category, list]) => (
            <div key={category} className="space-y-3">
              <h2 className="text-lg font-bold">{category}</h2>
              <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
                {list.map((item) => (
                  <FoodCard
                    key={item.id}
                    item={item}
                    currencySymbol={currencySymbol}
                    qty={lines[item.id]?.quantity ?? 0}
                    onAdd={() =>
                      add({ item_id: item.id, name: item.name, price: item.sell_price })
                    }
                    onInc={() => inc(item.id)}
                    onDec={() => dec(item.id)}
                  />
                ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* ===== Floating bottom drawer ===== */}
      {step === 1 && (
        <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-card/95 backdrop-blur">
          <Dialog>
            <div className="mx-auto flex max-w-2xl items-center gap-3 p-4">
              <DialogTrigger asChild>
                <Button variant="outline" size="lg" className="relative">
                  <ShoppingBag className="mr-2 h-4 w-4" />
                  View cart
                  {totals.count > 0 && (
                    <Badge className="ml-2 rounded-full bg-primary text-primary-foreground">
                      {totals.count}
                    </Badge>
                  )}
                </Button>
              </DialogTrigger>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-bold text-primary">
                  {formatMoney(totals.total, currencySymbol)}
                </p>
              </div>
              <Button size="lg" onClick={placeOrder} disabled={submitting || cartLines.length === 0}>
                {submitting ? "Placing…" : "Place Order"}
              </Button>
            </div>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Your order</DialogTitle>
              </DialogHeader>
              {cartLines.length === 0 ? (
                <p className="py-8 text-center text-sm text-muted-foreground">
                  Nothing in your cart yet.
                </p>
              ) : (
                <>
                  <ul className="divide-y">
                    {cartLines.map((l) => (
                      <li key={l.item_id} className="flex items-center gap-3 py-3">
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium">{l.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatMoney(l.price, currencySymbol)} each
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => dec(l.item_id)}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{l.quantity}</span>
                          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => inc(l.item_id)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => remove(l.item_id)}>
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>Total</span>
                    <span>{formatMoney(totals.total, currencySymbol)}</span>
                  </div>
                </>
              )}
            </DialogContent>
          </Dialog>
        </div>
      )}
    </div>
  );
}

function StepWizard({ current }: { current: 0 | 1 }) {
  const steps = ["Info", "Menu", "Confirmation"];
  const active = current + 1; // 1-based; confirmation (3) is reached on the next page
  return (
    <div className="mt-4 flex items-center gap-2 rounded-xl border bg-card/50 p-1.5 text-xs font-medium">
      {steps.map((label, i) => {
        const n = i + 1;
        const done = n < active;
        const isCurrent = n === active;
        return (
          <div
            key={label}
            className={
              "flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors " +
              (done
                ? "bg-primary/15 text-primary"
                : isCurrent
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground")
            }
          >
            <span
              className={
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px] " +
                (done || isCurrent
                  ? "bg-background/20"
                  : "border border-muted-foreground/40")
              }
            >
              {done ? <Check className="h-3 w-3" /> : n}
            </span>
            Step {n}: {label}
          </div>
        );
      })}
    </div>
  );
}

function FoodCard({
  item,
  currencySymbol,
  qty,
  onAdd,
  onInc,
  onDec,
}: {
  item: MenuItem;
  currencySymbol: string;
  qty: number;
  onAdd: () => void;
  onInc: () => void;
  onDec: () => void;
}) {
  const out = item.stock_quantity === 0;
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-muted">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <UtensilsCrossed className="h-8 w-8" />
          </div>
        )}
        {out && (
          <Badge className="absolute left-2 top-2 bg-black/70 text-white">Sold out</Badge>
        )}
      </div>
      <CardContent className="flex flex-col gap-2 p-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{item.name}</p>
          {item.description && (
            <p className="line-clamp-2 text-xs text-muted-foreground">{item.description}</p>
          )}
        </div>
        <div className="mt-auto flex items-center justify-between">
          <span className="text-sm font-bold text-primary">
            {formatMoney(item.sell_price, currencySymbol)}
          </span>
          {out ? null : qty === 0 ? (
            <Button size="sm" onClick={onAdd}>
              <Plus className="mr-1 h-4 w-4" />
              Add
            </Button>
          ) : (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onDec}>
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center text-sm font-semibold">{qty}</span>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={onInc}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
