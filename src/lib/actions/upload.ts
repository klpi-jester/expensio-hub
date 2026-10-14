"use server";

import { createClient } from "@/lib/supabase/server";

const BUCKET = "store_assets";
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const ALLOWED = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
]);

export type UploadResult =
  | { ok: true; url: string; path: string }
  | { ok: false; error: string };

/** Free-form folder label used to organize assets under the owner's namespace. */
function safeFolder(folder?: string): string {
  const cleaned = (folder ?? "misc").toLowerCase().replace(/[^a-z0-9_-]/g, "");
  return cleaned || "misc";
}

function safeName(name: string): string {
  const ext = name.includes(".") ? name.slice(name.lastIndexOf(".")) : "";
  const base = name
    .slice(0, name.lastIndexOf(".") > 0 ? name.lastIndexOf(".") : undefined)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "image"}${ext.toLowerCase()}`.replace(/\.[^a-z0-9]+$/, (m) =>
    /^\.[a-z0-9]{1,5}$/.test(m) ? m : "",
  );
}

/**
 * Uploads a store asset (logo / cover / item photo) to the public
 * `store_assets` bucket and returns its public URL.
 *
 * Files are namespaced under `<ownerId>/<folder>/...` so the storage RLS
 * policy (split_part(name,'/',1) = auth.uid()) allows the write.
 */
export async function uploadStoreAsset(
  formData: FormData,
): Promise<UploadResult> {
  const file = formData.get("file");
  const folder = formData.get("folder");

  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "No file selected" };
  }
  if (!ALLOWED.has(file.type)) {
    return { ok: false, error: "Unsupported image type (use PNG/JPEG/WEBP/GIF/AVIF)" };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "Image is too large (max 5 MB)" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, error: "You must be signed in to upload" };

  const ext = file.name.includes(".")
    ? file.name.slice(file.name.lastIndexOf(".")).toLowerCase()
    : ".png";
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${safeName(ext)}`;
  const path = `${user.id}/${safeFolder(typeof folder === "string" ? folder : undefined)}/${fileName}`;

  // Edge-safe: read the file as bytes instead of Node's Buffer (V8/Workers have
  // no global Buffer). Supabase storage.upload accepts an ArrayBufferView.
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, {
      contentType: file.type,
      upsert: true,
    });

  if (error) {
    return { ok: false, error: `Upload failed: ${error.message}` };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}
