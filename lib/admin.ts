import "server-only";
import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { marketplaceAdmin } from "@/lib/db/schema";

export async function getViewer() {
  const requestHeaders = await headers();
  if (!process.env.DATABASE_URL) return null;
  return auth.api.getSession({ headers: requestHeaders });
}
export async function isAdmin(userId: string) {
  const [row] = await db
    .select()
    .from(marketplaceAdmin)
    .where(eq(marketplaceAdmin.userId, userId))
    .limit(1);
  return Boolean(row);
}
export async function requireAdmin() {
  const session = await getViewer();
  if (!session?.user || !(await isAdmin(session.user.id)))
    throw new Error("Administrator access required.");
  return session.user;
}
