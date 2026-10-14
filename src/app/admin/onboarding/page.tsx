import { redirect } from "next/navigation";
import { getCurrentStore } from "@/lib/store-context";
import { CreateStoreForm } from "@/components/admin/create-store-form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Create your store · Expensio Dine" };
export const instant = false;

export default async function OnboardingPage() {
  // If a store already exists, skip onboarding.
  const store = await getCurrentStore();
  if (store) redirect("/admin/dashboard");

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Create your store</CardTitle>
          <CardDescription>
            Set up your storefront to start selling and get your public menu URL.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CreateStoreForm />
        </CardContent>
      </Card>
    </div>
  );
}
