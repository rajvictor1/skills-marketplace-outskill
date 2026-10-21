"use server";

import { createHash } from "node:crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";
import { getViewer } from "@/lib/admin";
import { db } from "@/lib/db";
import { marketplaceAdmin, marketplaceAdminInvite } from "@/lib/db/schema";

export async function redeemAdminInvite(form: FormData) {
  const token = String(form.get("token") ?? "");
  if (!/^[a-f0-9]{64}$/.test(token)) redirect("/admin/invite?error=invalid");

  const session = await getViewer();
  if (!session?.user) {
    redirect(`/auth/sign-in?invite=${encodeURIComponent(token)}`);
  }

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const redeemed = await db.transaction(async (tx) => {
    const [invite] = await tx
      .update(marketplaceAdminInvite)
      .set({ usedAt: new Date(), usedBy: session.user.id })
      .where(
        and(
          eq(marketplaceAdminInvite.tokenHash, tokenHash),
          isNull(marketplaceAdminInvite.usedAt),
          gt(marketplaceAdminInvite.expiresAt, new Date()),
        ),
      )
      .returning({ tokenHash: marketplaceAdminInvite.tokenHash });
    if (!invite) return false;
    await tx
      .insert(marketplaceAdmin)
      .values({ userId: session.user.id })
      .onConflictDoNothing();
    return true;
  });

  if (!redeemed) redirect("/admin/invite?error=expired");
  redirect("/admin");
}
