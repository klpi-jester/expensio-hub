"use client";

import { useState, useTransition } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createItem, updateItem, type ItemInput } from "@/lib/actions/items";
import { toast } from "sonner";
import type { Item, ItemMode } from "@/lib/supabase/database.types";

const NONE = "__none__";

type CategoryOption = { id: string; name: string };

// Numeric inputs are kept as strings in local state and coerced on submit.
type FormState = {
  name: string;
  sku: string;
  mode: ItemMode;
  category_id: string | null;
  description: string;
  image_url: string | null;
  buy_price: string;
  sell_price: string;
  stock_quantity: string;
};

function toFormState(item: Item | null): FormState {
  return {
    name: item?.name ?? "",
    sku: item?.sku ?? "",
    mode: (item?.mode as ItemMode) ?? "retail",
    category_id: item?.category_id ?? null,
    description: item?.description ?? "",
    image_url: item?.image_url ?? null,
    buy_price: String(item?.buy_price ?? 0),
    sell_price: String(item?.sell_price ?? 0),
    stock_quantity: String(item?.stock_quantity ?? 0),
  };
}

export function ItemFormDialog({
  open,
  onOpenChange,
  item,
  categories,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
  categories: CategoryOption[];
}) {
  const [pending, startTransition] = useTransition();
  const [form, setForm] = useState<FormState>(() => toFormState(item));

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit() {
    startTransition(async () => {
      const payload: ItemInput = {
        name: form.name,
        sku: form.sku ? form.sku : null,
        mode: form.mode,
        category_id:
          form.category_id && form.category_id !== NONE ? form.category_id : null,
        description: form.description ? form.description : null,
        image_url: form.image_url ?? null,
        buy_price: Number(form.buy_price),
        sell_price: Number(form.sell_price),
        stock_quantity: Number(form.stock_quantity),
      };

      const res = item
        ? await updateItem(item.id, payload)
        : await createItem(payload);

      if (res.ok) {
        toast.success(item ? "Item updated" : "Item created");
        onOpenChange(false);
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{item ? "Edit item" : "New item"}</DialogTitle>
          <DialogDescription>
            Retail items use the list view; resto items use the grid view.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="e.g. Cage-Free Eggs 30s"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                value={form.sku}
                onChange={(e) => set("sku", e.target.value)}
                placeholder="Optional"
              />
            </div>
            <div className="grid gap-2">
              <Label>Mode</Label>
              <Select
                value={form.mode}
                onValueChange={(v) => set("mode", v as ItemMode)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="retail">Retail (list)</SelectItem>
                  <SelectItem value="resto">Resto (grid)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Category</Label>
            <Select
              value={form.category_id ?? NONE}
              onValueChange={(v) => set("category_id", v === NONE ? null : v)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Uncategorized" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Uncategorized</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
              placeholder="Shown to guests on the public menu (optional)"
              rows={2}
            />
          </div>

          <ImageUploadField
            label="Item photo"
            folder="items"
            aspect="square"
            value={form.image_url}
            onChange={(url) => set("image_url", url)}
            hint="PNG/JPEG/WEBP, up to 5 MB."
          />

          <div className="grid grid-cols-3 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="buy">Buy price</Label>
              <Input
                id="buy"
                type="number"
                min={0}
                step="0.01"
                value={form.buy_price}
                onChange={(e) => set("buy_price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="sell">Sell price</Label>
              <Input
                id="sell"
                type="number"
                min={0}
                step="0.01"
                value={form.sell_price}
                onChange={(e) => set("sell_price", e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min={0}
                step="1"
                value={form.stock_quantity}
                onChange={(e) => set("stock_quantity", e.target.value)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={pending}>
            {pending ? "Saving…" : item ? "Save changes" : "Create item"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
