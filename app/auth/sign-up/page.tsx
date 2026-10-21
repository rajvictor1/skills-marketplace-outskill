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
    <main className="bg-background px-5 py-12 sm:px-8 sm:py-20">
      <AuthCard
        mode="sign-up"
        databaseConfigured={Boolean(process.env.DATABASE_URL)}
      />
    </main>
  );
}
