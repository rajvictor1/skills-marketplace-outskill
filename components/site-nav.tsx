import Link from "next/link";

import { Logo } from "@/components/logo";
import { AccountActions } from "@/components/account-actions";

const NAV_LINKS = [
  { href: "/skills", label: "Browse" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/security", label: "How vetting works" },
  { href: "/publish", label: "Publish" },
];

export function SiteNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-md">
      <nav className="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="shrink-0" aria-label="SkillPort home">
          <Logo />
        </Link>

        <div className="ml-2 hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <AccountActions />
      </nav>
    </header>
  );
}
