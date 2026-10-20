"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { CircleAlert, LockKeyhole } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

/**
 * Centered Better Auth form shared by /auth/sign-in and /auth/sign-up.
 */
export function AuthCard({ mode, databaseConfigured }: { mode: "sign-in" | "sign-up"; databaseConfigured: boolean }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const isSignUp = mode === "sign-up";

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSubmitting(true);
    const values = new FormData(event.currentTarget);
    const email = String(values.get("email") ?? "").trim();
    const password = String(values.get("password") ?? "");
    const name = String(values.get("name") ?? "").trim();

    try {
      const result = isSignUp
        ? await signUp.email({ name, email, password, callbackURL: "/dashboard/skills" })
        : await signIn.email({ email, password, callbackURL: "/dashboard/skills" });
      if (result.error) {
        setError(result.error.message || (isSignUp ? "We could not create this account." : "Email or password was not accepted."));
        return;
      }
      window.location.assign("/dashboard/skills");
    } catch {
      setError("Authentication could not reach the marketplace database. Check DATABASE_URL and the database migrations, then try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center">
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex flex-col items-center text-center">
          <Logo withWordmark={false} className="[&_svg]:size-8" />
          <h1 className="mt-4 text-xl font-semibold tracking-tight text-foreground">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            {isSignUp
              ? "Join to publish and install vetted skills."
              : "Sign in to publish and install vetted skills."}
          </p>
        </div>

        <p className="mt-5 flex items-start gap-2 rounded-lg border border-border bg-background/40 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
          {!databaseConfigured ? "Account access needs DATABASE_URL and the database migrations. Configure those first; this form will not send or store credentials until then." : isSignUp ? "Your account is stored in the SkillPort database. Email verification is disabled for this beta." : "Sign in to manage your private submissions and publish new skills."}
        </p>

        <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Ada Lovelace"
                required
                minLength={2}
                maxLength={80}
              />
            </div>
          )}

          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder="you@company.com"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="••••••••"
              required
              minLength={8}
              maxLength={128}
            />
          </div>

          {error && <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-3 py-2 text-xs leading-relaxed text-danger"><CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />{error}</p>}
          <Button type="submit" size="lg" className="w-full" disabled={submitting || !databaseConfigured}>
            {submitting ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/auth/sign-up"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
