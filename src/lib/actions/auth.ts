"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function siteUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
    "http://localhost:3000"
  );
}

export type AuthActionError = { ok: false; error: string };
export type SignInResult = { ok: true } | AuthActionError;
export type SignUpResult =
  | { ok: true; needsEmailConfirmation: boolean }
  | AuthActionError;

/** Only allow in-app destinations to avoid open-redirect abuse. */
function safeTarget(next?: string): string {
  return next && next.startsWith("/") ? next : "/admin/dashboard";
}

/** Kick off the Google OAuth flow via Supabase, then redirect to the callback. */
export async function signInWithGoogle(next: string = "/admin/dashboard") {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data?.url) {
    redirect("/auth/login?error=google-oauth");
  }

  redirect(data.url);
}

/** Sign the merchant out and return to the login screen. */
export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/auth/login");
}

/** Email + password sign-in. Sets the session cookie, then redirects. */
export async function signInWithEmail(
  email: string,
  password: string,
  next?: string,
): Promise<SignInResult> {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim().toLowerCase(),
    password,
  });

  if (error) {
    // Supabase returns e.g. "Invalid login credentials".
    return { ok: false, error: error.message };
  }

  redirect(safeTarget(next));
}

/** Register a new manual account. */
export async function signUpWithEmail(
  email: string,
  password: string,
  next?: string,
): Promise<SignUpResult> {
  if (!email || !password) {
    return { ok: false, error: "Email and password are required" };
  }
  if (password.length < 6) {
    return { ok: false, error: "Password must be at least 6 characters" };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: email.trim().toLowerCase(),
    password,
    options: { emailRedirectTo: `${siteUrl()}/auth/callback?next=${encodeURIComponent(safeTarget(next))}` },
  });

  if (error) {
    // Supabase returns e.g. "An account with this email already exists".
    return { ok: false, error: error.message };
  }

  // When email confirmation is enabled there is no session yet.
  if (!data.session) {
    return { ok: true, needsEmailConfirmation: true };
  }

  redirect(safeTarget(next));
}
