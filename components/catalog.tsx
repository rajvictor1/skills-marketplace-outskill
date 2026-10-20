"use client";

import { useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SkillCard } from "@/components/skill-card";
import { cn } from "@/lib/utils";
import { CATEGORY_GROUPS, getSubcategories, type SkillCategory } from "@/lib/skills/taxonomy";
import { CATEGORIES, type SampleSkill } from "@/lib/sample-data";

type SortKey = "popular" | "recent" | "safest";

const TIER_RANK: Record<string, number> = {
  verified_safe: 0,
  caution: 1,
  blocked: 2,
  pending: 3,
};

export function Catalog({ skills, focusedCategory }: { skills: SampleSkill[]; focusedCategory?: SkillCategory }) {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("All");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(focusedCategory ?? "All");
  const [subcategory, setSubcategory] = useState("All subcategories");
  const [sort, setSort] = useState<SortKey>("popular");

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = skills.filter((s) => {
      const matchesGroup = group === "All" || CATEGORY_GROUPS.some((item) => item.name === group && item.categories.some((entry) => entry.name === s.category));
      const matchesCategory = category === "All" || s.category === category;
      const matchesSubcategory = subcategory === "All subcategories" || s.subcategory === subcategory;
      const matchesQuery =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.description.toLowerCase().includes(q) ||
        s.author.name.toLowerCase().includes(q) ||
        (s.tags ?? []).some((tag) => tag.toLowerCase().includes(q));
      return matchesGroup && matchesCategory && matchesSubcategory && matchesQuery;
    });

    list = [...list].sort((a, b) => {
      if (sort === "popular") return b.installs - a.installs;
      if (sort === "recent")
        return b.updatedAt.localeCompare(a.updatedAt);
      return TIER_RANK[a.trustTier] - TIER_RANK[b.trustTier];
    });

    return list;
  }, [skills, query, group, category, subcategory, sort]);

  const visibleCategories = group === "All" ? [] : CATEGORY_GROUPS.find((item) => item.name === group)?.categories ?? [];

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
            placeholder="Search skills, authors, or use cases"
            className="h-13 rounded-full border-border bg-[#f6f7fb] pl-13 pr-5 text-sm"
            aria-label="Search skills"
          />
        </div>
        <div className="flex items-center gap-2">
          <SlidersHorizontal
            className="size-4 text-muted-foreground"
            aria-hidden
          />
          <div className="flex rounded-full border border-border bg-[#f6f7fb] p-1">
            {(
              [
                ["popular", "Popular"],
                ["recent", "Recent"],
                ["safest", "Safest"],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm transition-colors",
                  sort === key
                    ? "bg-white font-medium text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {!focusedCategory && <div className="mt-8 flex flex-wrap gap-2 border-b border-border pb-5" aria-label="Category groups">
        {["All", ...CATEGORY_GROUPS.map((item) => item.name)].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => { setGroup(item); setCategory("All"); setSubcategory("All subcategories"); }}
            className={cn(
              "rounded-full border px-5 py-2.5 text-sm font-medium transition-colors",
              group === item
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {item === "All" ? "All skills" : item}
          </button>
        ))}
      </div>}

      {!focusedCategory && visibleCategories.length > 0 && <div className="mt-4 flex flex-wrap gap-2" aria-label="Categories">
        {visibleCategories.map((item) => <button key={item.name} type="button" onClick={() => { setCategory(item.name); setSubcategory("All subcategories"); }} className={cn("rounded-full px-4 py-2 text-sm transition-colors", category === item.name ? "bg-accent font-semibold text-accent-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground")}>{item.name}</button>)}
      </div>}

      {category !== "All" && getSubcategories(category).length > 0 && (
        <div className={focusedCategory ? "mt-6 flex flex-wrap items-center gap-2" : "mt-3 flex items-center gap-3"}>
          {focusedCategory ? <span className="mr-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">Specialties</span> : null}
          {focusedCategory ? ["All subcategories", ...getSubcategories(category)].map((item) => <button key={item} type="button" onClick={() => setSubcategory(item)} className={cn("rounded-full border px-4 py-2 text-sm transition-colors", subcategory === item ? "border-primary bg-primary text-primary-foreground" : "border-border bg-white text-muted-foreground hover:border-primary/40 hover:text-foreground")}>{item === "All subcategories" ? "All specialties" : item}</button>) : <>
          <label htmlFor="subcategory-filter" className="text-xs text-muted-foreground">Narrow by subcategory</label>
          <select id="subcategory-filter" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="h-9 rounded-lg border border-border bg-card px-3 text-sm text-foreground">
            <option>All subcategories</option>
            {getSubcategories(category).map((item) => <option key={item}>{item}</option>)}
          </select>
          </>}
        </div>
      )}

      {/* results */}
      <p className="mt-8 text-sm text-muted-foreground">
        {results.length} {results.length === 1 ? "skill" : "skills"}
        {category !== "All" ? ` in ${category}` : group !== "All" ? ` in ${group}` : ""}
      </p>

      {results.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-card/40 p-12 text-center">
          <p className="text-sm font-medium text-foreground">
            {query || subcategory !== "All subcategories" ? "No skills match that search." : focusedCategory ? `No skills published in ${focusedCategory} yet.` : "No skills available yet."}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {query || subcategory !== "All subcategories" ? "Try a different keyword or specialty." : focusedCategory ? "Publish a skill to make this category useful for other builders." : "Published skills will appear here once creators submit them."}
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
