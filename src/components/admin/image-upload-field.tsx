"use client";

import { useRef, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { uploadStoreAsset, type UploadResult } from "@/lib/actions/upload";
import { cn } from "@/lib/utils";

type Props = {
  label: string;
  value: string | null;
  onChange: (url: string | null) => void;
  /** Storage sub-folder, e.g. "logos" | "covers" | "items". */
  folder: string;
  aspect?: "square" | "wide";
  hint?: string;
};

export function ImageUploadField({
  label,
  value,
  onChange,
  folder,
  aspect = "square",
  hint,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();

  function pick() {
    inputRef.current?.click();
  }

  function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const fd = new FormData();
    fd.set("file", file);
    fd.set("folder", folder);

    startTransition(async () => {
      const res: UploadResult = await uploadStoreAsset(fd);
      if (res.ok) {
        onChange(res.url);
        toast.success(`${label} updated`);
      } else {
        toast.error(res.error);
      }
      // allow re-selecting the same file
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 text-destructive"
            onClick={() => onChange(null)}
          >
            Remove
          </Button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={onFile}
      />

      <button
        type="button"
        onClick={pick}
        disabled={pending}
        className={cn(
          "flex w-full items-center justify-center overflow-hidden rounded-md border border-dashed bg-muted/30 transition hover:bg-muted/60",
          aspect === "wide" ? "aspect-[16/9]" : "aspect-square w-40",
          value ? "p-0" : "p-4",
        )}
        style={aspect === "wide" ? { width: "100%" } : undefined}
      >
        {pending ? (
          <span className="text-sm text-muted-foreground">Uploading…</span>
        ) : value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt={label} className="h-full w-full object-cover" />
        ) : (
          <span className="text-sm text-muted-foreground">Click to upload</span>
        )}
      </button>

      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
