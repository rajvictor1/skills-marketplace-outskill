"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPasswordForm() {
  const [token, setToken] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const fragment = new URLSearchParams(window.location.hash.slice(1));
      const value = fragment.get("token") ?? "";
      if (/^[A-Za-z0-9_-]{24,128}$/.test(value)) setToken(value);
      // Keep the one-time token out of the visible URL and copied links.
      if (window.location.hash) window.history.replaceState(null, "", window.location.pathname);
      setReady(true);
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!token || busy) return;
    setError("");
    const values = new FormData(event.currentTarget);
    const password = String(values.get("password") ?? "");
    const confirm = String(values.get("confirm") ?? "");
    if (password.length < 8 || password.length > 128) {
      setError("Use a password between 8 and 128 characters.");
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }
    setBusy(true);
    try {
      const result = await authClient.resetPassword({ token, newPassword: password });
      if (result.error) {
        setError("This reset link is invalid or has expired. Request a new link.");
        return;
      }
      setToken("");
      setDone(true);
    } catch {
      setError("We could not reach the account service. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border border-border bg-card p-7 shadow-lg sm:p-10">
      <p className="editorial-kicker text-primary">Account recovery</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Set a new password</h1>
      {!ready ? (
        <p className="mt-5 text-sm text-muted-foreground">Checking your reset link…</p>
      ) : done ? (
        <div className="mt-6 space-y-5">
          <p role="status" className="text-sm text-foreground">Your password has been changed. You can now sign in.</p>
          <Button asChild className="brand-button"><Link href="/auth/sign-in">Go to sign in</Link></Button>
        </div>
      ) : !token ? (
        <p role="alert" className="mt-5 text-sm text-muted-foreground">
          This reset link is missing or expired. Ask the site owner for a new one-time recovery link.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-6 grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="new-password">New password</Label>
            <Input id="new-password" name="password" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-12 rounded-xl" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input id="confirm-password" name="confirm" type="password" autoComplete="new-password" minLength={8} maxLength={128} required className="h-12 rounded-xl" />
          </div>
          {error && <p role="alert" className="text-sm text-danger">{error}</p>}
          <Button type="submit" disabled={busy} className="brand-button h-12">{busy ? "Updating…" : "Set password"}</Button>
          <p className="text-xs text-muted-foreground">Only you should enter your new password. Do not send it in chat.</p>
        </form>
      )}
    </section>
  );
}
