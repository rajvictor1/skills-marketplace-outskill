"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

import { Input } from "@/components/ui/input";
import { SkillCard, type CatalogCardSkill } from "@/components/skill-card";
import { cn } from "@/lib/utils";
import {
  CATEGORY_GROUPS,
  getSubcategories,
  type SkillCategory,
} from "@/lib/skills/taxonomy";
import { CATEGORIES } from "@/lib/sample-data";

type SortKey = "popular" | "recent" | "safest";
const PAGE_SIZE = 24;

export function Catalog({
  skills,
  initialTotal,
  initialPage = 0,
  focusedCategory,
  initialSubcategory,
  initialQuery = "",
}: {
  skills: CatalogCardSkill[];
  initialTotal?: number;
  initialPage?: number;
  focusedCategory?: SkillCategory;
  initialSubcategory?: string;
  initialQuery?: string;
}) {
  const allExamples =
    skills.length > 0 && skills.every((skill) => skill.metadata?.isSample);
  const [query, setQuery] = useState(initialQuery);
  const [group, setGroup] = useState("All");
  const [category, setCategory] = useState<(typeof CATEGORIES)[number]>(
    focusedCategory ?? "All",
  );
  const [subcategory, setSubcategory] = useState(initialSubcategory ?? "All subcategories");
  const [sort, setSort] = useState<SortKey>("popular");
  const [page, setPage] = useState(initialPage);
  const [total, setTotal] = useState(initialTotal ?? skills.length);
  const [pageSkills, setPageSkills] = useState<CatalogCardSkill[]>(skills);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(async () => {
      const params = new URLSearchParams({
        limit: String(PAGE_SIZE),
        offset: String(page * PAGE_SIZE),
        sort,
      });
      if (query.trim()) params.set("q", query.trim());
      if (category !== "All") params.set("category", category);
      if (subcategory !== "All subcategories") params.set("subcategory", subcategory);
      if (group !== "All") params.set("group", group);
      setLoading(true);
      try {
        const response = await fetch(`/api/v1/skills?${params.toString()}`);
        if (!response.ok) return;
        const result = await response.json() as { total: number; skills: CatalogCardSkill[] };
        if (active) {
          setPageSkills(result.skills);
          setTotal(result.total);
        }
      } catch {
        // Keep the server-rendered first page visible when the API is unavailable.
      } finally {
        if (active) setLoading(false);
      }
    }, query === initialQuery ? 0 : 250);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [category, group, initialQuery, page, query, sort, subcategory]);

  const results = useMemo(() => [...pageSkills], [pageSkills]);

  const visibleCategories =
    group === "All"
      ? []
      : (CATEGORY_GROUPS.find((item) => item.name === group)?.categories ?? []);

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
              onChange={(e) => { setPage(0); setQuery(e.target.value); }}
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
                    ["popular", "Popular"],
                    ["recent", "Recent"],
                    ["safest", "Safest"],
                  ]) as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => { setPage(0); setSort(key); }}
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
                setPage(0);
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
                setPage(0);
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
                onClick={() => { setPage(0); setSubcategory(item); }}
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
                onChange={(event) => { setPage(0); setSubcategory(event.target.value); }}
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
        {`${total.toLocaleString()} ${allExamples ? "example " : ""}${total === 1 ? "recipe" : "recipes"}`}
        {category !== "All"
          ? ` in ${category}`
          : group !== "All"
            ? ` in ${group}`
            : ""}
      </p>

      {results.length === 0 && !loading ? (
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
        <div className={cn("mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3", loading && "opacity-60")}>
          {results.map((skill) => (
            <SkillCard key={skill.id} skill={skill} />
          ))}
        </div>
      )}
      <nav className="mt-8 flex items-center justify-between gap-4 text-sm" aria-label="Recipe pages">
        <span className="text-muted-foreground">
          {total === 0 ? "No recipes" : `Showing ${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, total)} of ${total.toLocaleString()}`}
        </span>
        <div className="flex gap-3">
          <button type="button" disabled={page === 0 || loading} onClick={() => setPage((current) => Math.max(0, current - 1))} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Previous</button>
          <button type="button" disabled={(page + 1) * PAGE_SIZE >= total || loading} onClick={() => setPage((current) => current + 1)} className="rounded-full border border-border px-4 py-2 disabled:opacity-40">Next</button>
        </div>
      </nav>
    </div>
  );
}
