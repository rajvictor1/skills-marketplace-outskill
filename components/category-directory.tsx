import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CATEGORY_DESCRIPTIONS, CATEGORY_GROUPS, categorySlug } from "@/lib/skills/taxonomy";

const GROUP_COPY = [
  "Find skills for the teams and customer journeys that move a business forward.",
  "Explore the systems, data, and technical work behind modern products.",
  "Turn information and ideas into useful, repeatable work.",
] as const;

export function CategoryDirectory({ compact = false }: { compact?: boolean }) {
  return (
    <section id="categories" aria-labelledby="category-directory-title" className={compact ? "scroll-mt-20 bg-[#f3f5fb] px-5 py-20 sm:px-8" : "scroll-mt-20 bg-white px-5 py-20 sm:px-8"}>
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="editorial-kicker text-primary">Find your field</p>
            <h2 id="category-directory-title" className="mt-4 max-w-2xl text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              Browse skills by category.
            </h2>
          </div>
          <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
            Pick a field, then narrow down by specialty or search for a specific task.
          </p>
        </div>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {CATEGORY_GROUPS.map((group, groupIndex) => (
            <div key={group.name} className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_10px_35px_#11153a08]">
              <div className="border-b border-border bg-[#f6f7fb] px-6 py-7">
                <span className="font-mono text-xs font-semibold text-primary">0{groupIndex + 1} / 03</span>
                <h3 className="mt-3 text-2xl font-semibold tracking-[-0.04em] text-foreground">{group.name}</h3>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{GROUP_COPY[groupIndex]}</p>
              </div>
              <ul className="divide-y divide-border/70 px-3 py-2">
                {group.categories.map((category) => (
                  <li key={category.name}>
                    <Link href={`/skills/categories/${categorySlug(category.name)}`} className="group flex min-h-18 items-start justify-between gap-3 rounded-xl px-3 py-4 transition-colors hover:bg-[#f5f6ff] focus-visible:outline-2 focus-visible:outline-primary">
                      <span>
                        <span className="block text-sm font-semibold text-foreground group-hover:text-primary">{category.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{CATEGORY_DESCRIPTIONS[category.name]}</span>
                      </span>
                      <ArrowUpRight className="mt-0.5 size-4 shrink-0 text-muted-foreground group-hover:text-primary" aria-hidden />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
