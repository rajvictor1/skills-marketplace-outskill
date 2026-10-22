import { hasDatabaseConnection } from "@/lib/db/connection";
import { privateRobots } from "@/lib/seo/site";
import type { Metadata } from "next";
import { headers } from "next/headers";

import { AuthCard } from "@/components/auth-card";

export const metadata: Metadata = {
  robots: privateRobots,
  alternates: { canonical: null },
  title: "Create your account",
  description:
    "Create an account to discover, download and submit AI agent recipes for review.",
};

export default async function SignUpPage({ searchParams }: {
  searchParams: Promise<{ invite?: string }>;
}) {
  await headers();
  const invite = (await searchParams).invite;
  return (
    <main className="bg-background px-5 py-12 sm:px-8 sm:py-20">
      <AuthCard
        mode="sign-up"
        databaseConfigured={hasDatabaseConnection()}
        inviteToken={invite && /^[a-f0-9]{64}$/.test(invite) ? invite : undefined}
      />
    </main>
  );
}
