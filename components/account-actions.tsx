"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const { data: session, isPending } = useSession();
  if (isPending || !session?.user) {
    return <div className="ml-auto flex items-center gap-2"><Button variant="ghost" size="sm" className="hidden rounded-full px-4 text-foreground hover:bg-white/10 sm:inline-flex" asChild><Link href="/auth/sign-in">Sign in</Link></Button><Button size="sm" className="brand-button h-9 rounded-full px-5" asChild><Link href="/auth/sign-up">Get started</Link></Button></div>;
  }

  return <div className="ml-auto flex min-w-0 items-center gap-2">
    <Link href="/dashboard/skills" className="hidden max-w-40 truncate text-xs text-muted-foreground hover:text-foreground sm:block" title={session.user.email}>{session.user.name || session.user.email}</Link>
    <Button variant="ghost" size="sm" className="rounded-full px-4 text-foreground hover:bg-white/10" asChild><Link href="/dashboard/skills">My skills</Link></Button>
    <Button variant="outline" size="sm" className="rounded-full border-white/30 bg-transparent px-4 text-foreground hover:bg-white/10" onClick={async () => { await signOut(); window.location.assign("/"); }}>Sign out</Button>
  </div>;
}
