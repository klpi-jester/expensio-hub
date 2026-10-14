import { headers } from "next/headers";
import { requireStore } from "@/lib/store-context";
import { MenuQrScreen } from "@/components/admin/menu-qr-screen";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Menu QR code · Expensio Dine" };
export const instant = false;

export default async function MenuQrPage() {
  const store = await requireStore();

  // Prefer the configured public origin; fall back to the live request host so
  // production automatically renders the real domain (e.g. pos.expensio.com).
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? "http";
  const base =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? `${proto}://${host}`;
  const publicUrl = `${base}/menu/${store.slug}`;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Menu QR code</h1>
        <p className="text-sm text-muted-foreground">
          Share your online menu — print or download the code for tables and
          counters.
        </p>
      </div>

      <MenuQrScreen
        storeName={store.name}
        storeSlug={store.slug}
        publicUrl={publicUrl}
      />
    </div>
  );
}
