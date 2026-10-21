"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [admin, setAdmin] = useState(false);
  const userId = session?.user?.id;
  useEffect(() => {
    let active = true;
    if (userId)
      fetch("/api/me")
        .then((r) => r.json())
        .then((data) => {
          if (active) setAdmin(Boolean(data.admin));
        })
        .catch(() => {});
    return () => {
      active = false;
    };
  }, [userId]);
  if (isPending || !session?.user) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden rounded-full px-4 text-foreground hover:bg-white/10 sm:inline-flex"
          asChild
        >
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
        <Button
          size="sm"
          className="brand-button h-9 rounded-full px-5"
          asChild
        >
          <Link href="/auth/sign-up">Get started</Link>
        </Button>
      </div>
    );
  }

  async function logout() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="ml-auto flex min-w-0 items-center gap-2">
      <details className="relative sm:hidden">
        <summary
          aria-label="Account menu"
          className="cursor-pointer list-none rounded-full border border-white/30 px-3 py-2 text-xs font-semibold marker:hidden"
        >
          Account
        </summary>
        <div className="absolute right-0 top-11 z-50 grid w-48 gap-1 rounded-2xl border border-white/15 bg-[#191a42] p-2 shadow-xl">
          {admin && (
            <Link
              href="/admin"
              className="rounded-xl px-4 py-3 text-sm hover:bg-white/10"
            >
              Admin review desk
            </Link>
          )}
          <Link
            href="/dashboard/skills"
            className="rounded-xl px-4 py-3 text-sm hover:bg-white/10"
          >
            My skills
          </Link>
          <button
            onClick={logout}
            className="rounded-xl px-4 py-3 text-left text-sm hover:bg-white/10"
          >
            Sign out
          </button>
        </div>
      </details>
      <div className="hidden items-center gap-2 sm:flex">
        <Link
          href="/dashboard/skills"
          className="hidden max-w-40 truncate text-xs text-muted-foreground hover:text-foreground sm:block"
          title={session.user.email}
        >
          {session.user.name || session.user.email}
        </Link>
        {admin && (
          <Link
            href="/admin"
            className="rounded-full bg-white/10 px-3 py-2 text-xs font-semibold text-white"
          >
            Admin
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-4 text-foreground hover:bg-white/10"
          asChild
        >
          <Link href="/dashboard/skills">My skills</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-white/30 bg-transparent px-4 text-foreground hover:bg-white/10"
          onClick={logout}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
