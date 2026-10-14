/**
 * Centralized, validated access to the Supabase connection env vars.
 *
 * Accepts both the legacy anon-key name and Supabase's newer "publishable key"
 * name so either convention works:
 *   NEXT_PUBLIC_SUPABASE_ANON_KEY  (legacy)
 *   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (current, `sb_publishable_…`)
 *
 * Only the client-safe key is used here. The `sb_secret_…` key must never be
 * referenced from `NEXT_PUBLIC_*` vars or shipped to the browser.
 */
export function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL. Add it to .env.local (e.g. https://<ref>.supabase.co).",
    );
  }
  return url;
}

export function getSupabaseKey(): string {
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!key) {
    throw new Error(
      "Missing Supabase key. Set NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) to your publishable/anon key in .env.local.",
    );
  }
  return key;
}
