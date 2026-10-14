"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { createCategory, renameCategory, deleteCategory } from "@/lib/actions/categories";
import { toast } from "sonner";
import { Pencil, Trash2, Plus } from "lucide-react";
import type { Category } from "@/lib/supabase/database.types";

export function CategoriesManager({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function add() {
    const value = name.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await createCategory(value);
      if (res.ok) {
        setName("");
        toast.success("Category added");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function saveRename(id: string) {
    const value = editingName.trim();
    if (!value) return;
    startTransition(async () => {
      const res = await renameCategory(id, value);
      if (res.ok) {
        setEditingId(null);
        toast.success("Category renamed");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  function remove(category: Category) {
    if (!confirm(`Delete "${category.name}"? Items in it become uncategorized.`)) return;
    startTransition(async () => {
      const res = await deleteCategory(category.id);
      if (res.ok) {
        toast.success("Category deleted");
        router.refresh();
      } else {
        toast.error(res.error);
      }
    });
  }

  return (
    <Card>
      <CardContent className="space-y-4 pt-6">
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="New category name…"
          />
          <Button onClick={add} disabled={pending || !name.trim()}>
            <Plus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>

        {categories.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <ul className="divide-y">
            {categories.map((category) => (
              <li key={category.id} className="flex items-center gap-2 py-2">
                {editingId === category.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveRename(category.id)}
                      autoFocus
                    />
                    <Button size="sm" onClick={() => saveRename(category.id)}>
                      Save
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 font-medium">{category.name}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => {
                        setEditingId(category.id);
                        setEditingName(category.name);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={pending}
                      onClick={() => remove(category)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
