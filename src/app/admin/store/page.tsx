import { requireStore } from "@/lib/store-context";
import { StoreSettingsForm } from "@/components/admin/store-settings-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "My store · Expensio Dine" };
export const instant = false;

export default async function StoreSettingsPage() {
  const store = await requireStore();

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">My store</h1>
        <p className="text-sm text-muted-foreground">
          Manage your storefront branding and public menu details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Store profile</CardTitle>
          <CardDescription>
            These appear on your public menu at /menu/{store.slug}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StoreSettingsForm store={store} />
        </CardContent>
      </Card>
    </div>
  );
}
