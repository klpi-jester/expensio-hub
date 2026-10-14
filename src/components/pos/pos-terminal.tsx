"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  usePosCart,
  type CartLine,
} from "@/lib/stores/pos-cart";
import { cartTotals } from "@/lib/stores/pos-cart";
import { checkout } from "@/lib/actions/sales";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  LayoutGrid,
  List,
} from "lucide-react";
import type { Item, ItemMode } from "@/lib/supabase/database.types";

type CategoryOption = { id: string; name: string };

export function PosTerminal({
  items,
  categories,
  currencySymbol,
}: {
  items: Item[];
  categories: CategoryOption[];
  currencySymbol: string;
}) {
  const router = useRouter();
  const lines = usePosCart((s) => s.lines);
  const addItem = usePosCart((s) => s.addItem);
  const increment = usePosCart((s) => s.increment);
  const decrement = usePosCart((s) => s.decrement);
  const remove = usePosCart((s) => s.remove);
  const clear = usePosCart((s) => s.clear);

  const [mode, setMode] = useState<ItemMode>("retail");
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const cartLines = useMemo(() => Object.values(lines), [lines]);
  const totals = useMemo(() => cartTotals(cartLines), [cartLines]);

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (i.mode !== mode) return false;
      if (category !== "all" && i.category_id !== category) return false;
      if (q && !i.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, mode, category, query]);

  function addToCart(item: Item) {
    if (item.stock_quantity === 0) {
      toast.error(`${item.name} is out of stock`);
      return;
    }
    addItem({
      item_id: item.id,
      name: item.name,
      mode: item.mode as ItemMode,
      buy_price: item.buy_price,
      sell_price: item.sell_price,
      stock: item.stock_quantity,
    });
  }

  function doCheckout() {
    startTransition(async () => {
      const payload = cartLines.map((l) => ({
        item_id: l.item_id,
        quantity: l.quantity,
      }));
      const res = await checkout(payload);
      if (res.ok) {
        toast.success(
          `Sale completed · ${formatMoney(res.totalRevenue, currencySymbol)} (profit ${formatMoney(res.totalProfit, currencySymbol)})`,
        );
        clear();
        setConfirmOpen(false);
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-[1fr_360px]">
      {/* Catalog */}
      <div className="flex min-h-0 flex-col space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-md border p-0.5">
            <ModeButton
              active={mode === "retail"}
              onClick={() => setMode("retail")}
              icon={<List className="h-4 w-4" />}
              label="Retail (list)"
            />
            <ModeButton
              active={mode === "resto"}
              onClick={() => setMode("resto")}
              icon={<LayoutGrid className="h-4 w-4" />}
              label="Resto (grid)"
            />
          </div>

          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative ml-auto w-full max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search items…"
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {visible.length === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              No {mode} items match your filters.
            </div>
          ) : mode === "retail" ? (
            <div className="space-y-2 pr-3">
              {visible.map((item) => (
                <RetailRow
                  key={item.id}
                  item={item}
                  categoryName={
                    item.category_id ? categoryNames.get(item.category_id) : undefined
                  }
                  currencySymbol={currencySymbol}
                  onAdd={() => addToCart(item)}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 pr-3 sm:grid-cols-3 xl:grid-cols-4">
              {visible.map((item) => (
                <RestoCard
                  key={item.id}
                  item={item}
                  currencySymbol={currencySymbol}
                  onAdd={() => addToCart(item)}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Cart */}
      <div className="flex min-h-0 flex-col rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <ShoppingCart className="h-5 w-5" />
          <span className="font-semibold">Current sale</span>
          <Badge variant="secondary" className="ml-auto">
            {totals.count}
          </Badge>
        </div>

        <ScrollArea className="min-h-0 flex-1">
          {cartLines.length === 0 ? (
            <div className="flex h-40 items-center justify-center px-6 text-center text-sm text-muted-foreground">
              Cart is empty. Select items to begin.
            </div>
          ) : (
            <ul className="divide-y px-4">
              {cartLines.map((line) => (
                <CartRow
                  key={line.item_id}
                  line={line}
                  currencySymbol={currencySymbol}
                  onInc={() => increment(line.item_id)}
                  onDec={() => decrement(line.item_id)}
                  onRemove={() => remove(line.item_id)}
                />
              ))}
            </ul>
          )}
        </ScrollArea>

        <div className="space-y-3 border-t p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Cost</span>
            <span>{formatMoney(totals.cost, currencySymbol)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Est. profit</span>
            <span className="text-emerald-400">
              {formatMoney(totals.revenue - totals.cost, currencySymbol)}
            </span>
          </div>
          <Separator />
          <div className="flex items-center justify-between text-lg font-bold">
            <span>Total</span>
            <span>{formatMoney(totals.revenue, currencySymbol)}</span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              onClick={() => clear()}
              disabled={cartLines.length === 0}
            >
              Clear
            </Button>
            <Button
              className="flex-1"
              disabled={cartLines.length === 0}
              onClick={() => setConfirmOpen(true)}
            >
              Charge {formatMoney(totals.revenue, currencySymbol)}
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm sale</DialogTitle>
            <DialogDescription>
              {totals.count} item(s) · {formatMoney(totals.revenue, currencySymbol)}{" "}
              total. Stock will be reduced accordingly.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-60 overflow-auto rounded-md border">
            <ul className="divide-y text-sm">
              {cartLines.map((l) => (
                <li key={l.item_id} className="flex justify-between px-3 py-2">
                  <span>
                    {l.name} × {l.quantity}
                  </span>
                  <span>{formatMoney(l.sell_price * l.quantity, currencySymbol)}</span>
                </li>
              ))}
            </ul>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>
              Cancel
            </Button>
            <Button onClick={doCheckout} disabled={pending}>
              {pending ? "Processing…" : "Complete sale"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium transition-colors",
        active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function RetailRow({
  item,
  categoryName,
  currencySymbol,
  onAdd,
}: {
  item: Item;
  categoryName?: string;
  currencySymbol: string;
  onAdd: () => void;
}) {
  const out = item.stock_quantity === 0;
  return (
    <div className="flex items-center gap-4 rounded-md border px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{item.name}</p>
        <p className="text-xs text-muted-foreground">
          {categoryName ?? "Uncategorized"}
          {item.sku ? ` · ${item.sku}` : ""} · stock {item.stock_quantity}
        </p>
      </div>
      <span className="tabular-nums font-semibold">
        {formatMoney(item.sell_price, currencySymbol)}
      </span>
      <Button size="sm" onClick={onAdd} disabled={out}>
        {out ? "Out" : "Add"}
      </Button>
    </div>
  );
}

function RestoCard({
  item,
  currencySymbol,
  onAdd,
}: {
  item: Item;
  currencySymbol: string;
  onAdd: () => void;
}) {
  const out = item.stock_quantity === 0;
  return (
    <button
      onClick={onAdd}
      disabled={out}
      className={cn(
        "flex flex-col items-start gap-1 rounded-lg border p-4 text-left transition-colors hover:border-primary hover:bg-muted/50",
        out && "opacity-50",
      )}
    >
      <span className="line-clamp-2 font-medium">{item.name}</span>
      <span className="text-sm text-muted-foreground">
        {formatMoney(item.sell_price, currencySymbol)}
      </span>
      <span className="text-xs text-muted-foreground">
        {out ? "Out of stock" : `${item.stock_quantity} left`}
      </span>
    </button>
  );
}

function CartRow({
  line,
  currencySymbol,
  onInc,
  onDec,
  onRemove,
}: {
  line: CartLine;
  currencySymbol: string;
  onInc: () => void;
  onDec: () => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{line.name}</p>
        <p className="text-xs text-muted-foreground">
          {formatMoney(line.sell_price, currencySymbol)} each
        </p>
      </div>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-7 w-7" onClick={onDec}>
          <Minus className="h-3 w-3" />
        </Button>
        <span className="w-6 text-center text-sm tabular-nums">{line.quantity}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={onInc}
          disabled={line.stock > 0 && line.quantity >= line.stock}
        >
          <Plus className="h-3 w-3" />
        </Button>
      </div>
      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
        <Trash2 className="h-3.5 w-3.5 text-destructive" />
      </Button>
    </li>
  );
}
