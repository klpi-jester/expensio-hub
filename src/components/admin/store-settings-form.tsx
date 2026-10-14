"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ImageUploadField } from "@/components/admin/image-upload-field";
import { updateStore } from "@/lib/actions/stores";
import type { Store } from "@/lib/supabase/database.types";

function slugify(v: string): string {
  return v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function StoreSettingsForm({ store }: { store: Store }) {
  const router = useRouter();
  const [name, setName] = useState(store.name);
  const [slug, setSlug] = useState(store.slug);
  const [description, setDescription] = useState(store.description ?? "");
  const [logoUrl, setLogoUrl] = useState<string | null>(store.logo_url);
  const [coverUrl, setCoverUrl] = useState<string | null>(store.cover_url);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const res = await updateStore({
        name,
        slug,
        description,
        logo_url: logoUrl ?? "",
        cover_url: coverUrl ?? "",
      });
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Store name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="slug">Public URL slug</Label>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">/menu/</span>
            <Input
              id="slug"
              value={slug}
              onChange={(e) => setSlug(slugify(e.target.value))}
              required
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Shown at the top of your public menu."
        />
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <ImageUploadField
          label="Logo"
          folder="logos"
          aspect="square"
          value={logoUrl}
          onChange={setLogoUrl}
          hint="Square image, shown beside your store name."
        />
        <ImageUploadField
          label="Cover image"
          folder="covers"
          aspect="wide"
          value={coverUrl}
          onChange={setCoverUrl}
          hint="Banner across the top of the public menu."
        />
      </div>

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </Button>
        <a
          href={`/menu/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          View public menu
        </a>
      </div>
    </form>
  );
}
