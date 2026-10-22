import type { Metadata } from "next";
import Link from "next/link";
import { count, desc, ilike, inArray, or } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { AdminTabs } from "@/components/admin-tabs";
import { getViewer, isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  communityRating,
  marketplaceAdmin,
  skill,
  skillDownload,
  user,
} from "@/lib/db/schema";
import { privateRobots } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Registered users · Skillbuffet Admin",
  robots: privateRobots,
  alternates: { canonical: null },
};

const PAGE_SIZE = 25;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.user) redirect("/auth/sign-in");
  if (!(await isAdmin(viewer.user.id))) notFound();

  const params = await searchParams;
  const page = Math.min(1000, Math.max(0, Math.floor(Number(params.page) || 0)));
  const query = (params.q ?? "").trim().slice(0, 80);
  const filter = query
    ? or(ilike(user.name, `%${query}%`), ilike(user.email, `%${query}%`))
    : undefined;
  const [people, [totalRow]] = await Promise.all([
    db
      .select({
        id: user.id,
        name: user.name,
        email: user.email,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
      })
      .from(user)
      .where(filter)
      .orderBy(desc(user.createdAt), desc(user.id))
      .limit(PAGE_SIZE)
      .offset(page * PAGE_SIZE),
    db.select({ total: count() }).from(user).where(filter),
  ]);
  const ids = people.map((person) => person.id);
  const [admins, recipes, reviews, downloads] = ids.length
    ? await Promise.all([
        db
          .select({ userId: marketplaceAdmin.userId })
          .from(marketplaceAdmin)
          .where(inArray(marketplaceAdmin.userId, ids)),
        db
          .select({ userId: skill.authorId, total: count() })
          .from(skill)
          .where(inArray(skill.authorId, ids))
          .groupBy(skill.authorId),
        db
          .select({ userId: communityRating.userId, total: count() })
          .from(communityRating)
          .where(inArray(communityRating.userId, ids))
          .groupBy(communityRating.userId),
        db
          .select({ userId: skillDownload.userId, total: count() })
          .from(skillDownload)
          .where(inArray(skillDownload.userId, ids))
          .groupBy(skillDownload.userId),
      ])
    : [[], [], [], []];
  const adminIds = new Set(admins.map((row) => row.userId));
  const recipeCounts = new Map(recipes.map((row) => [row.userId, row.total]));
  const reviewCounts = new Map(reviews.map((row) => [row.userId, row.total]));
  const downloadCounts = new Map(downloads.map((row) => [row.userId, row.total]));
  const total = totalRow?.total ?? 0;
  const pageHref = (next: number) =>
    `/admin/users?page=${next}${query ? `&q=${encodeURIComponent(query)}` : ""}`;

  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <AdminTabs active="users" />
      <header className="rounded-3xl bg-category-teal p-7 sm:p-9">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">
          Skillbuffet / Admin
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
          Registered users
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted-foreground">
          {total} {total === 1 ? "account" : "accounts"}
          {query ? " matching your search" : " in the marketplace"}. Account
          details are visible only to administrators.
        </p>
      </header>

      <form action="/admin/users" className="mt-7 flex flex-wrap gap-3">
        <label className="sr-only" htmlFor="user-search">
          Search users by name or email
        </label>
        <input
          id="user-search"
          name="q"
          type="search"
          defaultValue={query}
          maxLength={80}
          placeholder="Search name or email"
          className="min-h-11 min-w-64 flex-1 rounded-xl border border-border bg-card px-4 text-sm"
        />
        <button className="rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">
          Search
        </button>
        {query && (
          <Link href="/admin/users" className="rounded-xl border border-border px-5 py-2 text-sm font-semibold">
            Clear
          </Link>
        )}
      </form>

      <div className="mt-7 overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-border bg-primary/5 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="p-4">User</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Role</th>
              <th className="p-4 text-right">Recipes</th>
              <th className="p-4 text-right">Reviews</th>
              <th className="p-4 text-right">Downloads</th>
            </tr>
          </thead>
          <tbody>
            {people.map((person) => (
              <tr key={person.id} className="border-b border-border last:border-0">
                <td className="p-4">
                  <strong className="block font-semibold">{person.name}</strong>
                  <span className="block break-all text-xs text-muted-foreground">
                    {person.email}
                  </span>
                </td>
                <td className="whitespace-nowrap p-4">
                  {person.createdAt.toISOString().slice(0, 10)}
                </td>
                <td className="p-4">
                  {adminIds.has(person.id) ? "Admin" : "Member"}
                  {!person.emailVerified && (
                    <span className="block text-xs text-muted-foreground">
                      Email not verified
                    </span>
                  )}
                </td>
                <td className="p-4 text-right">{recipeCounts.get(person.id) ?? 0}</td>
                <td className="p-4 text-right">{reviewCounts.get(person.id) ?? 0}</td>
                <td className="p-4 text-right">{downloadCounts.get(person.id) ?? 0}</td>
              </tr>
            ))}
            {!people.length && (
              <tr>
                <td colSpan={6} className="p-8 text-center text-muted-foreground">
                  No users found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="mt-5 flex items-center justify-between gap-4 text-sm">
        <span className="text-muted-foreground">
          Showing {people.length ? page * PAGE_SIZE + 1 : 0}–
          {Math.min((page + 1) * PAGE_SIZE, total)} of {total}
        </span>
        <div className="flex gap-4 font-semibold text-primary">
          {page > 0 && <Link href={pageHref(page - 1)}>← Previous</Link>}
          {(page + 1) * PAGE_SIZE < total && (
            <Link href={pageHref(page + 1)}>Next →</Link>
          )}
        </div>
      </div>
      <p className="mt-5 text-xs text-muted-foreground">
        This lists registered accounts, not people currently online. Passwords,
        session tokens and private recipe files are never shown here.
      </p>
    </main>
  );
}
