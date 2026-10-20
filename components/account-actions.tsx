"use client";

import Link from "next/link";
import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";

export function AccountActions() {
  const { data: session, isPending } = useSession();
  if (isPending || !session?.user) {
    return <div className="ml-auto flex items-center gap-2"><Button variant="ghost" size="sm" asChild><Link href="/auth/sign-in">Sign in</Link></Button><Button size="sm" asChild><Link href="/auth/sign-up">Get started</Link></Button></div>;
  }

  return <div className="ml-auto flex min-w-0 items-center gap-2">
    <Link href="/dashboard/skills" className="hidden max-w-40 truncate text-xs text-muted-foreground hover:text-foreground sm:block" title={session.user.email}>{session.user.name || session.user.email}</Link>
    <Button variant="ghost" size="sm" asChild><Link href="/dashboard/skills">My skills</Link></Button>
    <Button variant="outline" size="sm" onClick={async () => { await signOut(); window.location.assign("/"); }}>Sign out</Button>
  </div>;
}
