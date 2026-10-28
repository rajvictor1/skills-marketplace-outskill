"use client";

import Link from "next/link";
import { UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const router = useRouter();
  const { data: session } = useSession();
  const [admin, setAdmin] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
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
  useEffect(() => {
    if (!accountMenuOpen) return;

    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !accountMenuRef.current?.contains(event.target)) {
        setAccountMenuOpen(false);
      }
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAccountMenuOpen(false);
    }

    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);
  if (!session?.user) {
    return (
      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="hidden rounded-full px-4 text-foreground hover:bg-primary/10 sm:inline-flex"
          asChild
        >
          <Link href="/auth/sign-in">Sign in</Link>
        </Button>
        <Button
          size="sm"
          className="brand-button h-9 rounded-full px-3 sm:px-5"
          asChild
        >
          <Link href="/auth/sign-up">
            <span className="sm:hidden">Join</span>
            <span className="hidden sm:inline">Get started</span>
          </Link>
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
      <div ref={accountMenuRef} className="relative md:hidden">
        <button
          type="button"
          aria-label={accountMenuOpen ? "Close account menu" : "Open account menu"}
          aria-expanded={accountMenuOpen}
          aria-controls="mobile-account-menu"
          onClick={() => setAccountMenuOpen((value) => !value)}
          className="flex size-11 cursor-pointer items-center justify-center rounded-xl border border-border text-xs font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <UserRound className="size-4" aria-hidden="true" />
        </button>
        {accountMenuOpen && (
          <div id="mobile-account-menu" className="absolute right-0 top-11 z-50 grid w-48 gap-1 rounded-2xl border border-border bg-popover p-2 shadow-xl">
            {admin && (
              <Link
                href="/admin"
                onClick={() => setAccountMenuOpen(false)}
                className="rounded-xl px-4 py-3 text-sm hover:bg-primary/10"
              >
                Admin review desk
              </Link>
            )}
            <Link
              href="/dashboard/skills"
              onClick={() => setAccountMenuOpen(false)}
              className="rounded-xl px-4 py-3 text-sm hover:bg-primary/10"
            >
              My recipes
            </Link>
            <button
              onClick={() => { setAccountMenuOpen(false); void logout(); }}
              className="rounded-xl px-4 py-3 text-left text-sm hover:bg-primary/10"
            >
              Sign out
            </button>
          </div>
        )}
      </div>
      <div className="hidden items-center gap-2 md:flex">
        <Link
          href="/dashboard/skills"
          className="hidden max-w-40 truncate text-xs text-muted-foreground hover:text-foreground 2xl:block"
          title={session.user.email}
        >
          {session.user.name || session.user.email}
        </Link>
        {admin && (
          <Link
            href="/admin"
            className="rounded-full bg-primary/10 px-3 py-2 text-xs font-semibold text-foreground"
          >
            Admin
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full px-4 text-foreground hover:bg-primary/10"
          asChild
        >
          <Link href="/dashboard/skills">My recipes</Link>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="rounded-full border-border bg-transparent px-4 text-foreground hover:bg-primary/10"
          onClick={logout}
        >
          Sign out
        </Button>
      </div>
    </div>
  );
}
