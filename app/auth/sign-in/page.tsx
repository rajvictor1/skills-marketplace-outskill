import type { Metadata } from "next";
import { headers } from "next/headers";

import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Sign in",
  description:
    "Sign in to publish and install security-scanned AI agent skills.",
};

export default async function SignInPage() {
  await headers();
  return (
    <main className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <AuthCard mode="sign-in" databaseConfigured={Boolean(process.env.DATABASE_URL)} />
    </main>
  );
}
