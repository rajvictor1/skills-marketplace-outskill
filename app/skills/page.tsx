import type { Metadata } from "next";
import { headers } from "next/headers";

import { Catalog } from "@/components/catalog";
import { getCatalogState } from "@/lib/skills/catalog";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";

export const metadata: Metadata = {
  title: "Browse skills",
  description:
    "Browse security-scanned AI agent skills by category, permissions, compatibility, and trust tier.",
};

export default async function SkillsPage() {
  await headers();
  const catalog = await getCatalogState();
  return (
    <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div className="max-w-2xl">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Browse skills
        </h1>
        <p className="mt-3 text-base text-muted-foreground">
          Published skills that have completed the marketplace security scan. Blocked submissions do not appear here.
        </p>
      </div>

      {catalog.hasSampleContent && <div className="mt-6 max-w-3xl"><DemoDataNotice>The catalog includes example skills for preview. Their stored scan records do not represent customer submissions or live install analytics.</DemoDataNotice></div>}
      {catalog.source === "unavailable" && <div className="mt-6 max-w-3xl"><DemoDataNotice>The database is configured but could not be reached. The catalog is empty until the connection and migrations are available.</DemoDataNotice></div>}
      <div className="mt-10">
        <Catalog skills={catalog.skills} />
      </div>
    </main>
  );
}
