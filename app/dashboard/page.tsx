export const dynamic = "force-dynamic";
import Link from "next/link";
import { getCatalogState } from "@/lib/skills/catalog";
import { getRatings } from "@/lib/community";
import { RatingSummary } from "@/components/community-reviews";
import { SkillCard } from "@/components/skill-card";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";
export default async function DashboardPage() {
  const [catalog, reviews] = await Promise.all([
    getCatalogState(),
    getRatings("marketplace"),
  ]);
  const downloads = catalog.skills.reduce(
    (total, item) => total + item.installs,
    0,
  );
  return (
    <main className="mx-auto max-w-7xl px-5 py-10">
      <p className="editorial-kicker text-primary">Marketplace overview</p>
      <h1 className="mt-3 text-4xl font-semibold tracking-tight">
        A clear view of your community.
      </h1>
      <p className="mt-4 text-sm text-muted-foreground">
        Live catalog and recorded download data. Unmeasured activity is not
        estimated.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [catalog.skills.length, "Approved public skills"],
          [downloads, "Recorded downloads"],
          [
            new Set(catalog.skills.map((s) => s.category)).size +
              "/" +
              SKILL_CATEGORY_NAMES.length,
            "Categories with skills",
          ],
          [reviews.count, "Marketplace reviews"],
        ].map(([value, label]) => (
          <article
            key={label}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-2 text-sm text-muted-foreground">{label}</p>
          </article>
        ))}
      </div>
      {catalog.source === "unavailable" && (
        <p role="alert" className="mt-5 rounded-xl bg-caution/10 p-4 text-sm">
          Catalog data is temporarily unavailable. These counts cannot currently
          be confirmed.
        </p>
      )}
      <div className="mt-7 rounded-2xl bg-[#e7f1ed] p-6">
        <h2 className="text-xl font-semibold">Community sentiment</h2>
        <div className="mt-3">
          <RatingSummary average={reviews.average} count={reviews.count} />
        </div>
        <Link
          href="/reviews"
          className="mt-4 inline-block text-sm font-semibold text-primary underline"
        >
          Read community reviews
        </Link>
      </div>
      <h2 className="mt-10 text-2xl font-semibold">Approved catalog</h2>
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {catalog.skills.slice(0, 6).map((skill) => (
          <SkillCard key={skill.id} skill={skill} />
        ))}
      </div>
      {!catalog.skills.length && (
        <p className="mt-5 rounded-2xl border border-dashed border-border p-8 text-muted-foreground">
          Approved skills will appear here. Submit your first skill for review
          to start the catalog.
        </p>
      )}
      <p className="mt-8 text-xs text-muted-foreground">
        Download counts represent one account per skill version, excluding the
        creator. Agent runs, revenue, time saved and execution outcomes are not
        tracked.
      </p>
    </main>
  );
}
