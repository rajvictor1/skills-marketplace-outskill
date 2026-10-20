import type { Metadata } from "next";
import { headers } from "next/headers";

import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  title: "Create your account",
  description:
    "Create an account to publish and install security-scanned AI agent skills.",
};

export default async function SignUpPage() {
  await headers();
  return (
    <main className="mx-auto max-w-sm px-4 py-16 sm:py-24">
      <AuthCard mode="sign-up" databaseConfigured={Boolean(process.env.DATABASE_URL)} />
    </main>
  );
}
