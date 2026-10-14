import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { EmailAuthForm } from "@/components/auth/email-auth-form";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sign in · Expensio Dine",
};

type SearchParams = { next?: string; error?: string };

// Reads searchParams at request time.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const { next, error } = await searchParams;
  const target = next && next.startsWith("/admin") ? next : "/admin/dashboard";

  return (
    <main className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">Expensio Dine</CardTitle>
          <CardDescription>Merchant POS · sign in to manage your store</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                Could not start Google sign-in. Check your Supabase Google provider
                settings.
              </AlertDescription>
            </Alert>
          )}

          <GoogleSignInButton next={target} />

          <div className="flex items-center gap-3">
            <Separator className="flex-1" />
            <span className="text-xs uppercase text-muted-foreground">or</span>
            <Separator className="flex-1" />
          </div>

          <EmailAuthForm next={target} />

          <p className="text-center text-xs text-muted-foreground">
            Access is restricted to authenticated merchant accounts.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
