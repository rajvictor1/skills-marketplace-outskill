import { ThemeToggle } from "@/components/theme-toggle";
import Link from "next/link";
import { Logo } from "@/components/logo";
import { AccountActions } from "@/components/account-actions";
import { MobileNavMenu } from "@/components/mobile-nav-menu";

const NAV_LINKS = [
  { href: "/skills", label: "Recipe Marketplace" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/security", label: "How vetting works" },
  { href: "/publish", label: "Publish" },
  { href: "/about", label: "About Product" },
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
        <MobileNavMenu links={NAV_LINKS} />
      </nav>
    </header>
  );
}
