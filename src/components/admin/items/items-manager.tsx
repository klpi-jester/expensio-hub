"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ItemFormDialog } from "@/components/admin/items/item-form-dialog";
import { deleteItem, toggleItemActive } from "@/lib/actions/items";
import { formatMoney } from "@/lib/format";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Search } from "lucide-react";
import type { Item } from "@/lib/supabase/database.types";

type CategoryOption = { id: string; name: string };

export function ItemsManager({
  items,
  categories,
  currencySymbol,
}: {
  items: Item[];
  categories: CategoryOption[];
  currencySymbol: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Item | null>(null);
  const [pending, startTransition] = useTransition();

  const categoryNames = useMemo(
    () => new Map(categories.map((c) => [c.id, c.name])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (i) =>
        i.name.toLowerCase().includes(q) ||
        (i.sku ?? "").toLowerCase().includes(q),
    );
  }, [items, query]);

  function openCreate() {
    setEditing(null);
    setDialogOpen(true);
  }

  function openEdit(item: Item) {
    setEditing(item);
    setDialogOpen(true);
  }

  function handleDelete(item: Item) {
    if (!confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const res = await deleteItem(item.id);
      if (res.ok) {
        toast.success("Item deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function handleToggle(item: Item) {
    startTransition(async () => {
      const res = await toggleItemActive(item.id, !item.is_active);
      if (res.ok) {
        toast.success(item.is_active ? "Item deactivated" : "Item activated");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search name or SKU…"
            className="pl-9"
          />
        </div>
        <Button onClick={openCreate} className="ml-auto">
          <Plus className="mr-2 h-4 w-4" />
          New item
        </Button>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Mode</TableHead>
              <TableHead className="text-right">Buy</TableHead>
              <TableHead className="text-right">Sell</TableHead>
              <TableHead className="text-right">Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="h-24 text-center text-muted-foreground">
                  No items yet. Create your first item.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((item) => (
                <TableRow key={item.id} className={!item.is_active ? "opacity-50" : ""}>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {item.sku ?? "—"}
                  </TableCell>
                  <TableCell>
                    {item.category_id
                      ? categoryNames.get(item.category_id) ?? "—"
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{item.mode}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.buy_price, currencySymbol)}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(item.sell_price, currencySymbol)}
                  </TableCell>
                  <TableCell className="text-right">{item.stock_quantity}</TableCell>
                  <TableCell>
                    <Badge variant={item.is_active ? "default" : "outline"}>
                      {item.is_active ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" disabled={pending}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEdit(item)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggle(item)}>
                          {item.is_active ? "Deactivate" : "Activate"}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDelete(item)}
                        >
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <ItemFormDialog
        key={editing?.id ?? "new"}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        item={editing}
        categories={categories}
      />
    </div>
  );
}
