import { redirect } from "next/navigation";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSettings } from "@/lib/settings";
import { getCurrentStore } from "@/lib/store-context";
import { AdminNav } from "@/components/admin/admin-nav";
import { SignOutButton } from "@/components/admin/sign-out-button";

// Reads the session (cookies) on every request, so this segment renders on demand.
// NOTE: under cacheComponents we must NOT use `export const dynamic = "force-dynamic"`
// (it fails the build); `instant = false` + `await connection()` is the supported opt-out.
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Lock the whole /admin subtree to request-time rendering (real-time auth,
  // live DB queries). This also safely permits unstable values like
  // Date.now()/new Date() that would otherwise break build-time prerendering.
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const settings = await getSettings();
  const store = await getCurrentStore();
  // Tenant store name wins; fall back to the global setting until onboarded.
  const brand = store?.name ?? settings.store_name;
  const email = user.email ?? "Merchant";

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 border-r border-sidebar-border bg-sidebar md:block">
        <AdminNav storeName={brand} />
      </aside>

      <div className="flex flex-1 flex-col">
        <header className="flex h-16 items-center justify-between border-b px-6">
          <span className="text-sm text-muted-foreground md:hidden">
            {brand}
          </span>
          <div className="ml-auto flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">
              {email}
            </span>
            <SignOutButton />
          </div>
        </header>

        {/* Mobile nav */}
        <div className="border-b md:hidden">
          <AdminNav storeName={brand} />
        </div>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
