"use client";

import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";

import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/skill-card";
import { cn } from "@/lib/utils";
import {
  CATEGORY_GROUPS,
  getSubcategories,
  type SkillCategory,
} from "@/lib/skills/taxonomy";
import { CATEGORIES, type SampleSkill } from "@/lib/sample-data";

type SortKey = "popular" | "recent" | "safest";
type CatalogView = "grid" | "list";

const TIER_RANK: Record<string, number> = {
  verified_safe: 0,
  caution: 1,
  blocked: 2,
  pending: 3,
};

export function Catalog({
  skills,
  focusedCategory,
  initialQuery = "",
  variant = "standard",
}: {
  skills: SampleSkill[];
  focusedCategory?: SkillCategory;
  initialQuery?: string;
  variant?: "standard" | "marketplace";
}) {
  const allExamples =
    skills.length > 0 && skills.every((skill) => skill.metadata?.isSample);
  const [query, setQuery] = useState(initialQuery);
  const [group, setGroup] = useState("All");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    focusedCategory ?? "All",
  );
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [subcategory, setSubcategory] = useState("All subcategories");
  const [sort, setSort] = useState<SortKey>("popular");
  const [view, setView] = useState<CatalogView>("grid");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = skills.filter((s) => {
      const matchesGroup =
        variant === "marketplace" ||
        group === "All" ||
        CATEGORY_GROUPS.some(
          (item) =>
            item.name === group &&
            item.categories.some((entry) => entry.name === s.category),
        );
      const matchesCategory =
        variant === "marketplace"
          ? selectedCategories.length === 0 || selectedCategories.includes(s.category)
          : category === "All" || s.category === category;
      const matchesSubcategory =
        subcategory === "All subcategories" || s.subcategory === subcategory;
      const matchesQuery =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.author.name.toLowerCase().includes(q) ||
        (s.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return (
        matchesGroup && matchesCategory && matchesSubcategory && matchesQuery
      );
    });

    list = [...list].sort((a, b) => {
      if (sort === "popular")
        return allExamples
          ? a.name.localeCompare(b.name)
          : b.installs - a.installs;
      if (sort === "recent") return b.updatedAt.localeCompare(a.updatedAt);
      return TIER_RANK[a.trustTier] - TIER_RANK[b.trustTier];
    });

    return list;
  }, [skills, query, group, category, selectedCategories, subcategory, sort, allExamples, variant]);

  const visibleCategories =
    group === "All"
      ? []
      : (CATEGORY_GROUPS.find((item) => item.name === group)?.categories ?? []);

  const clearFilters = () => {
    setQuery("");
    setGroup("All");
    setCategory("All");
    setSelectedCategories([]);
    setSubcategory("All subcategories");
  };

  const toggleMarketplaceCategory = (name: string) => {
    setSelectedCategories((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : [...current, name],
    );
    setSubcategory("All subcategories");
  };

  const marketplaceFilters = (prefix: "mobile" | "desktop") => (
    <div className="space-y-6">
      <section aria-labelledby={`${prefix}-marketplace-field-filter`}>
        <div className="mb-3 flex items-center justify-between">
          <h3 id={`${prefix}-marketplace-field-filter`} className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
            Field
          </h3>
          {(selectedCategories.length > 0 || subcategory !== "All subcategories" || query) && (
            <button type="button" onClick={clearFilters} className="text-xs font-medium text-primary hover:underline">
              Clear all
            </button>
          )}
        </div>
        <label className="mb-3 flex cursor-pointer items-center justify-between rounded-lg px-2 py-2 text-sm text-foreground hover:bg-secondary">
          <span className="flex items-center gap-2.5">
            <input
              type="checkbox"
              checked={selectedCategories.length === 0}
              onChange={() => {
                setSelectedCategories([]);
                setSubcategory("All subcategories");
              }}
              aria-label="Show all recipe categories"
              className="size-4 accent-primary"
            />
            All categories
          </span>
          <span className="text-xs tabular-nums text-muted-foreground">{skills.length}</span>
        </label>
        <div className="space-y-4">
          {CATEGORY_GROUPS.map((item) => (
            <div key={item.name}>
              <h4 className="mb-1 flex items-center justify-between px-2 py-1.5 text-xs font-semibold text-foreground">
                <span>{item.name}</span><span className="font-normal tabular-nums text-muted-foreground">{item.categories.reduce((count, entry) => count + skills.filter((skill) => skill.category === entry.name).length, 0)}</span>
              </h4>
              <ul className="space-y-0.5">
                {item.categories.map((entry) => {
                  const count = skills.filter((skill) => skill.category === entry.name).length;
                  return (
                    <li key={entry.name}>
                      <label className="flex cursor-pointer items-center justify-between gap-2 rounded-lg px-2 py-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground">
                        <span className="flex min-w-0 items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(entry.name)}
                            onChange={() => toggleMarketplaceCategory(entry.name)}
                            aria-label={`Filter by ${entry.name}`}
                            className="size-4 shrink-0 accent-primary"
                          />
                          <span className="truncate">{entry.name}</span>
                        </span>
                        <span className="text-xs tabular-nums">{count}</span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>
      {selectedCategories.length === 1 && getSubcategories(selectedCategories[0] as SkillCategory).length > 0 && (
        <section aria-labelledby={`${prefix}-marketplace-specialty-filter`} className="border-t border-border pt-5">
          <label id={`${prefix}-marketplace-specialty-filter`} htmlFor={`${prefix}-marketplace-subcategory`} className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Specialty</label>
          <select id={`${prefix}-marketplace-subcategory`} value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-primary">
            <option>All subcategories</option>
            {getSubcategories(selectedCategories[0] as SkillCategory).map((item) => <option key={item}>{item}</option>)}
          </select>
        </section>
      )}
    </div>
  );

  if (variant === "marketplace") {
    const sortOptions: [SortKey, string][] = allExamples
      ? [["popular", "A–Z"], ["recent", "Recently updated"]]
      : [["popular", "Most recorded download requests"], ["recent", "Recently updated"], ["safest", "Static scan tier"]];
    const hasFilters = selectedCategories.length > 0 || subcategory !== "All subcategories" || query.trim() !== "";

    return (
      <div className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        {allExamples && (
          <p className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
            These are curated examples for preview. They are not verified community results.
          </p>
        )}
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search recipes, tasks, or creators…" className="h-12 rounded-xl border-border bg-card pl-11 pr-10 text-sm shadow-sm" aria-label="Search recipes, tasks, or creators" />
            {query && <button type="button" onClick={() => setQuery("")} aria-label="Clear search" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-muted-foreground hover:bg-secondary hover:text-foreground"><X className="size-4" aria-hidden /></button>}
          </div>
          <label className="sr-only" htmlFor="marketplace-sort">Sort recipes</label>
          <select id="marketplace-sort" value={sort} onChange={(event) => setSort(event.target.value as SortKey)} className="h-12 rounded-xl border border-border bg-card px-4 text-sm text-foreground shadow-sm focus-visible:outline-2 focus-visible:outline-primary">
            {sortOptions.map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
          <div className="flex h-12 items-center rounded-xl border border-border bg-card p-1 shadow-sm" role="group" aria-label="Recipe display style">
            {([ ["grid", LayoutGrid, "Grid view"], ["list", List, "List view"] ] as const).map(([mode, Icon, label]) => (
              <button key={mode} type="button" aria-label={label} aria-pressed={view === mode} onClick={() => setView(mode)} className={cn("flex size-10 items-center justify-center rounded-lg transition-colors", view === mode ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}><Icon className="size-4" aria-hidden /></button>
            ))}
          </div>
        </div>

        <details className="mt-4 rounded-xl border border-border bg-card p-4 lg:hidden">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium marker:hidden"><SlidersHorizontal className="size-4 text-primary" aria-hidden /> Filters{hasFilters && <span className="ml-auto rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">Active</span>}</summary>
          <div className="mt-4 border-t border-border pt-4">{marketplaceFilters("mobile")}</div>
        </details>

        <div className="mt-7 grid items-start gap-8 lg:grid-cols-[235px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-border bg-card p-4 shadow-sm lg:block" aria-label="Recipe filters">
            {marketplaceFilters("desktop")}
          </aside>
          <section aria-label="Recipe results" className="min-w-0">
            <div className="flex min-h-9 flex-wrap items-center justify-between gap-2">
              <p aria-live="polite" className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">{results.length}</span> {results.length === 1 ? "recipe" : "recipes"}{selectedCategories.length === 1 ? ` in ${selectedCategories[0]}` : selectedCategories.length > 1 ? ` across ${selectedCategories.length} categories` : " available"}{allExamples ? " · preview examples" : ""}</p>
              {hasFilters && <button type="button" onClick={clearFilters} className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline">Clear filters <ArrowUpRight className="size-3.5" aria-hidden /></button>}
            </div>
            {results.length === 0 ? (
              <div className="mt-4 rounded-2xl border border-dashed border-border bg-card p-8 text-center sm:p-12">
                <p className="text-base font-semibold text-foreground">{query || subcategory !== "All subcategories" ? "No recipes match those filters." : "No recipes in this field yet."}</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{query || subcategory !== "All subcategories" ? "Try a broader search or clear the filters to see all available recipes." : "Explore another field or publish a recipe for this category."}</p>
                <button type="button" onClick={clearFilters} className="mt-5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary">Clear filters</button>
              </div>
            ) : (
              <div className={cn("mt-4", view === "grid" ? "grid gap-4 sm:grid-cols-2 xl:grid-cols-3" : "grid gap-3")}>
                {results.map((skill) => <SkillCard key={skill.id} skill={skill} variant="marketplace" layout={view} />)}
              </div>
            )}
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* search + sort */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-5 top-1/2 size-5 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search recipes, authors, or use cases"
            className="h-13 rounded-full border-border bg-background pl-13 pr-5 text-sm"
            aria-label="Search recipes"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="size-4 text-muted-foreground"
            aria-hidden
          />
          <div className="flex rounded-full border border-border bg-background p-1">
            {(
              (allExamples
                ? [
                    ["popular", "A–Z"],
                    ["recent", "Recent"],
                  ]
                : [
                    ["popular", "Most recorded downloads"],
                    ["recent", "Recent"],
                    ["safest", "Static scan tier"],
                  ]) as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  sort === key
                    ? "bg-card font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!focusedCategory && (
        <div
          className="mt-8 flex flex-wrap gap-2 border-b border-border pb-5"
          aria-label="Category groups"
        >
          {["All", ...CATEGORY_GROUPS.map((item) => item.name)].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setGroup(item);
                setCategory("All");
                setSubcategory("All subcategories");
              }}
              className={cn(
                "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
                group === item
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {item === "All" ? "All recipes" : item}
            </button>
          ))}
        </div>
      )}

      {!focusedCategory && visibleCategories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2" aria-label="Categories">
          {visibleCategories.map((item) => (
            <button
              key={item.name}
              type="button"
              onClick={() => {
                setCategory(item.name);
                setSubcategory("All subcategories");
              }}
              className={cn(
                "rounded-full px-4 py-2 text-sm transition-colors",
                category === item.name
                  ? "bg-accent font-semibold text-accent-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              {item.name}
            </button>
          ))}
        </div>
      )}

      {category !== "All" && getSubcategories(category).length > 0 && (
        <div
          className={
            focusedCategory
              ? "mt-6 flex flex-wrap items-center gap-2"
              : "mt-3 flex items-center gap-3"
          }
        >
          {focusedCategory ? (
            <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              Specialties
            </span>
          ) : null}
          {focusedCategory ? (
            ["All subcategories", ...getSubcategories(category)].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setSubcategory(item)}
                className={cn(
                  "rounded-full border px-4 py-2 text-sm transition-colors",
                  subcategory === item
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                )}
              >
                {item === "All subcategories" ? "All specialties" : item}
              </button>
            ))
          ) : (
            <>
              <label
                htmlFor="subcategory-filter"
                className="text-xs text-muted-foreground"
              >
                Narrow by subcategory
              </label>
              <select
                id="subcategory-filter"
                value={subcategory}
                onChange={(event) => setSubcategory(event.target.value)}
                className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground"
              >
                <option>All subcategories</option>
                {getSubcategories(category).map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </>
          )}
        </div>
      )}

      {/* results */}
      <p className="mt-8 text-sm text-muted-foreground">
        {`${results.length} ${allExamples ? "example " : ""}${results.length === 1 ? "recipe" : "recipes"}`}
        {category !== "All"
          ? ` in ${category}`
          : group !== "All"
            ? ` in ${group}`
            : ""}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {query || subcategory !== "All subcategories"
              ? "No recipes match that search."
              : focusedCategory
                ? `No recipes published in ${focusedCategory} yet.`
                : "No recipes available yet."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query || subcategory !== "All subcategories"
              ? "Try a different keyword or specialty."
              : focusedCategory
                ? "Publish a recipe to make this category useful for other builders."
                : "Published recipes will appear here once creators submit them."}
          </p>
        </div>
      ) : (
        <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {results.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
    </div>
  );
}
