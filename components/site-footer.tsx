import Link from "next/link";

import { Logo } from "@/components/logo";

export function SiteFooter() {
  return (
    <footer className="dark-surface border-t border-white/10 bg-[#10112f] text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.5fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-3 max-w-xs text-sm text-muted-foreground">
            A marketplace for AI agent skills where every skill is security
            scanned before it can be published.
          </p>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Marketplace</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/skills" className="hover:text-foreground">
                Browse skills
              </Link>
            </li>
            <li>
              <Link href="/publish" className="hover:text-foreground">
                Publish a skill
              </Link>
            </li>
            <li>
              <Link href="/dashboard" className="hover:text-foreground">
                Your dashboard
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="text-sm font-medium text-foreground">Trust</p>
          <ul className="mt-3 grid gap-2 text-sm text-muted-foreground">
            <li>
              <Link href="/security" className="hover:text-foreground">
                How vetting works
              </Link>
            </li>
            <li>
              <a
                href="https://github.com/harshith-vaddiparthy/skills-marketplace-outskill"
                className="hover:text-foreground"
                target="_blank"
                rel="noreferrer"
              >
                Open source (MIT)
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-5 py-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p>Built as an open teaching project. Free to use and build on.</p>
          <p>
            Automated vetting reduces risk. It is not a guarantee of safety.
          </p>
        </div>
      </div>
    </footer>
  );
}
