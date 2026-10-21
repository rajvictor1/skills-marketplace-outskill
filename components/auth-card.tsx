"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleAlert,
  LockKeyhole,
  ShieldCheck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signIn, signUp } from "@/lib/auth-client";

export function AuthCard({
  mode,
  databaseConfigured,
}: {
  mode: "sign-in" | "sign-up";
  databaseConfigured: boolean;
}) {
  const router = useRouter();
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
        ? await signUp.email({
            name,
            email,
            password,
            callbackURL: "/dashboard/skills",
          })
        : await signIn.email({
            email,
            password,
            callbackURL: "/dashboard/skills",
          });
      if (result.error) {
        setError(
          result.error.message ||
            (isSignUp
              ? "We could not create this account."
              : "Email or password was not accepted."),
        );
        return;
      }
      router.push("/dashboard/skills");
      router.refresh();
    } catch {
      setError(
        "Authentication could not reach the marketplace database. Please try again shortly.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] border border-border bg-white shadow-[0_24px_80px_#151b3b18] lg:min-h-[640px] lg:grid-cols-[1.02fr_0.98fr]">
      <div className="brand-hero dark-surface relative flex flex-col justify-between px-8 py-12 text-foreground sm:px-12 sm:py-14 lg:px-16">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90">
            <ShieldCheck className="size-4 text-[#a9ead2]" aria-hidden />
            Skills with a closer look
          </span>
          <h2 className="mt-14 max-w-md text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.055em] text-white sm:text-5xl">
            {isSignUp
              ? "A better place to build with AI skills."
              : "Welcome back to your skills."}
          </h2>
          <p className="mt-5 max-w-md text-base leading-relaxed text-[#d4d6eb]">
            {isSignUp
              ? "Join Skillbuffet to publish your expertise and explore skills with visible security reviews."
              : "Sign in to manage your submissions, explore the marketplace, and keep building."}
          </p>
        </div>
        <div className="mt-14 border-t border-white/20 pt-6 text-sm leading-relaxed text-[#c6c9e3]">
          <p className="font-semibold text-white">What happens next?</p>
          <p className="mt-2">
            Explore the catalog, read a skill&apos;s review result, or submit
            your own skill for scanning.
          </p>
          <Link
            href="/skills"
            className="mt-4 inline-flex items-center gap-2 font-semibold text-[#c2cdff] hover:underline"
          >
            Browse skills <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>

      <div className="flex flex-col justify-center px-7 py-12 sm:px-12 lg:px-16">
        <p className="editorial-kicker text-primary">
          Your Skillbuffet account
        </p>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-foreground sm:text-4xl">
          {isSignUp ? "Create your account" : "Sign in"}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {isSignUp
            ? "Start discovering and publishing AI agent skills."
            : "Continue to your skills and dashboard."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
          {isSignUp && (
            <div className="grid gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Your name"
                required
                minLength={2}
                maxLength={80}
                className="h-12 rounded-xl border-border bg-[#f8f8fb] px-4"
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
              className="h-12 rounded-xl border-border bg-[#f8f8fb] px-4"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete={isSignUp ? "new-password" : "current-password"}
              placeholder="At least 8 characters"
              required
              minLength={8}
              maxLength={128}
              className="h-12 rounded-xl border-border bg-[#f8f8fb] px-4"
            />
          </div>
          {error && (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/5 px-4 py-3 text-xs leading-relaxed text-danger"
            >
              <CircleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="brand-button mt-1 h-12 w-full rounded-full text-sm font-semibold"
            disabled={submitting || !databaseConfigured}
          >
            {submitting
              ? "Please wait…"
              : isSignUp
                ? "Create account"
                : "Sign in"}
          </Button>
        </form>

        <p className="mt-5 text-center text-xs text-muted-foreground">
          Read our{" "}
          <Link href="/terms" className="text-primary underline">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="text-primary underline">
            Privacy policy
          </Link>{" "}
          before using Skillbuffet.
        </p>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isSignUp ? (
            <>
              Already have an account?{" "}
              <Link
                href="/auth/sign-in"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href="/auth/sign-up"
                className="font-semibold text-primary underline-offset-4 hover:underline"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
        <p className="mt-8 flex items-start gap-2 rounded-xl bg-[#f4f5fb] px-4 py-3 text-xs leading-relaxed text-muted-foreground">
          <LockKeyhole
            className="mt-0.5 size-3.5 shrink-0 text-primary"
            aria-hidden
          />
          {!databaseConfigured
            ? "Account access needs a configured database. This form cannot submit until setup is complete."
            : isSignUp
              ? "Your account is stored in the Skillbuffet database. Email verification is disabled for this beta."
              : "Sign in to manage your private submissions and publish new skills."}
        </p>
      </div>
    </div>
  );
}
