import { createHash } from "node:crypto";
import type { Metadata } from "next";
import Link from "next/link";
import { and, eq, gt, isNull } from "drizzle-orm";
import { getViewer } from "@/lib/admin";
import { db } from "@/lib/db";
import { marketplaceAdminInvite } from "@/lib/db/schema";
import { privateRobots } from "@/lib/seo/site";
import { redeemAdminInvite } from "@/app/actions/admin-invite";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin invitation",
  robots: privateRobots,
  alternates: { canonical: null },
};

export default async function AdminInvitePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const { token = "", error } = await searchParams;
  const validShape = /^[a-f0-9]{64}$/.test(token);
  const [session, invite] = await Promise.all([
    getViewer(),
    validShape
      ? db
          .select({ tokenHash: marketplaceAdminInvite.tokenHash })
          .from(marketplaceAdminInvite)
          .where(
            and(
              eq(
                marketplaceAdminInvite.tokenHash,
                createHash("sha256").update(token).digest("hex"),
              ),
              isNull(marketplaceAdminInvite.usedAt),
              gt(marketplaceAdminInvite.expiresAt, new Date()),
            ),
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  return (
    <main className="mx-auto w-full max-w-xl px-5 py-16 sm:py-24">
      <div className="rounded-3xl border border-border bg-card p-7 shadow-xl sm:p-10">
        <p className="editorial-kicker text-primary">Skillbuffet</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
          Admin invitation
        </h1>
        {!invite.length || error ? (
          <p role="alert" className="mt-5 text-sm leading-relaxed text-muted-foreground">
            This invitation has expired or was already used. Ask the owner for a new link.
          </p>
        ) : !session?.user ? (
          <>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Sign in or create an account, then accept this invitation. The
              invitation grants full recipe review and publishing controls to
              the account that accepts it first.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link className="brand-button rounded-full px-5 py-3 text-sm font-semibold" href={`/auth/sign-in?invite=${token}`}>
                Sign in
              </Link>
              <Link className="rounded-full border border-border px-5 py-3 text-sm font-semibold text-foreground" href={`/auth/sign-up?invite=${token}`}>
                Create account
              </Link>
            </div>
          </>
        ) : (
          <>
            <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
              Signed in as <strong className="text-foreground">{session.user.email}</strong>.
              Accepting grants this account full admin access. This invitation
              works once and cannot be transferred after acceptance.
            </p>
            <form action={redeemAdminInvite} className="mt-7">
              <input type="hidden" name="token" value={token} />
              <button className="brand-button rounded-full px-6 py-3 text-sm font-semibold" type="submit">
                Accept admin access
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
