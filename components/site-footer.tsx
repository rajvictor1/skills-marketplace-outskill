import Link from "next/link";
import { Logo } from "@/components/logo";
const GROUPS = [
  {
    title: "Explore",
    links: [
      ["Browse skills", "/skills"],
      ["Submit a skill", "/publish"],
      ["Creator workspace", "/dashboard/skills"],
      ["Community reviews", "/reviews"],
    ],
  },
  {
    title: "Build",
    links: [
      ["Documentation", "/docs"],
      ["Publishing guide", "/docs/publishing"],
      ["API reference", "/docs/api"],
      ["Changelog", "/docs/changelog"],
    ],
  },
  {
    title: "Trust",
    links: [
      ["Review & security", "/docs/security"],
      ["Privacy policy", "/privacy"],
      ["Terms & conditions", "/terms"],
    ],
  },
];
export function SiteFooter() {
  return (
    <footer className="dark-surface border-t border-white/10 bg-sidebar text-foreground">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
            A curated home for useful AI skills. Scan the instructions. Review
            the details. Build something worthwhile.
          </p>
          <a
            href="https://github.com/rajvictor1/skills-marketplace-outskill"
            target="_blank"
            rel="noreferrer"
            className="mt-5 inline-block text-sm text-[#c5bcff] underline"
          >
            Project repository ↗
          </a>
        </div>
        {GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold">{group.title}</p>
            <ul className="mt-4 grid gap-3 text-sm text-muted-foreground">
              {group.links.map(([label, href]) => (
                <li key={href}>
                  <Link href={href} className="hover:text-white">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-7xl flex-wrap justify-between gap-3 px-5 py-6 text-xs text-muted-foreground sm:px-8">
          <p>
            © {new Date().getFullYear()} Skillbuffet. Built on the upstream
            MIT-licensed project.
          </p>
          <a
            href="https://github.com/harshith-vaddiparthy/skills-marketplace-outskill"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Original project credits ↗
          </a>
          <p>
            Automated scanning and administrator review reduce risk; they do not
            guarantee safety.
          </p>
        </div>
      </div>
    </footer>
  );
}
