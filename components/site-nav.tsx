import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Menu } from "lucide-react";

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
    <header className="dark-surface sticky top-0 z-40 border-b border-border bg-sidebar/95 text-foreground backdrop-blur-xl">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center gap-2 px-3 sm:gap-3 sm:px-8 xl:gap-6">
        <Link href="/" className="shrink-0" aria-label="Skillbuffet home">
          <Logo />
        </Link>

        <div className="ml-4 hidden items-center gap-1 xl:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </div>

        <AccountActions />
        <ThemeToggle />
        <details className="group relative xl:hidden">
          <summary
            className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-border text-foreground marker:hidden hover:bg-primary/10"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" aria-hidden />
          </summary>
          <div className="absolute right-0 top-12 w-56 rounded-2xl border border-border bg-popover p-2 shadow-2xl">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-xl px-4 py-3 text-sm text-foreground hover:bg-primary/10"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </details>
      </nav>
    </header>
  );
}
