import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { CATEGORY_DESCRIPTIONS, CATEGORY_GROUPS, categorySlug } from "@/lib/skills/taxonomy";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows/templates";

const GROUP_COPY = [
  "Find skills for the teams and customer journeys that move a business forward.",
  "Explore the systems, data, and technical work behind modern products.",
  "Turn information and ideas into useful, repeatable work.",
] as const;

const GROUP_TONES = ["violet", "teal", "peach"] as const;

export function CategoryDirectory({ compact = false }: { compact?: boolean }) {
  return (
    <section id="categories" aria-labelledby="category-directory-title" className={`scroll-mt-20 bg-surface-ivory px-5 sm:px-8 ${compact ? "py-20" : "py-24"}`}>
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

        <div className="mt-12 grid items-start gap-6 lg:grid-cols-3 lg:gap-8">
          {CATEGORY_GROUPS.map((group, groupIndex) => (
            <div key={group.name} data-tone={GROUP_TONES[groupIndex]} className="category-group overflow-hidden rounded-[1.75rem] border bg-white">
              <div className="category-group-header border-b px-6 py-7 lg:min-h-52">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-mono text-xs font-semibold">{String(groupIndex + 1).padStart(2, "0")} / {String(CATEGORY_GROUPS.length).padStart(2, "0")}</span>
                  <span className="rounded-full border border-current/15 bg-white/50 px-2.5 py-1 text-[11px] font-medium">{group.categories.length} fields</span>
                </div>
                <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em]">{group.name}</h3>
                <p className="mt-2 min-h-10 text-sm leading-relaxed text-muted-foreground">{GROUP_COPY[groupIndex]}</p>
              </div>
              <ul className="divide-y divide-border/70 px-3 py-2">
                {group.categories.map((category) => (
                  <li key={category.name}>
                    <Link href={`/skills/categories/${categorySlug(category.name)}`} className="category-link group flex min-h-18 items-start justify-between gap-3 rounded-xl px-3 py-4">
                      <span>
                        <span className="category-label block text-sm font-semibold text-foreground">{category.name}</span>
                        <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">{CATEGORY_DESCRIPTIONS[category.name]}</span>
                        {WORKFLOW_TEMPLATES.some((template) => template.category === category.name) && <span className="mt-2 block text-[11px] font-semibold text-primary">n8n workflow available</span>}
                      </span>
                      <ArrowUpRight className="category-arrow mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
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
