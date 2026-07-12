"use client";

import { useMemo, useState } from "react";
import type { ElementType } from "react";
import {
  ArrowUpRight,
  Check,
  Clipboard,
  Code2,
  Copy,
  Database,
  FileText,
  Filter,
  GitFork,
  Layers3,
  Moon,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
  Sun,
  Terminal,
  Wrench,
  X,
} from "lucide-react";

import directoryData from "@/data/combined.json";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Skill = {
  id: string;
  name: string;
  author: string;
  repo: string | null;
  description: string;
  installs: number;
  downloads: number;
  stars: number;
  category: string;
  tags: string[];
  source: string;
  url: string;
  installCommand: string;
  lastUpdated: string;
};

const skills = directoryData.skills as Skill[];
const byCategory = directoryData.byCategory as Record<string, number>;
const categories = ["All", ...Object.keys(byCategory)];
const featuredTags = Array.from(
  skills.reduce((counts, skill) => {
    skill.tags.forEach((tag) => counts.set(tag, (counts.get(tag) ?? 0) + 1));
    return counts;
  }, new Map<string, number>())
)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 14)
  .map(([tag]) => tag);

const categoryIcons: Record<string, ElementType> = {
  "AI & ML": Sparkles,
  Backend: Database,
  "Browser Automation": Wrench,
  Clawdbot: Package,
  DevOps: Terminal,
  Documents: FileText,
  Frontend: Code2,
  Mobile: Layers3,
  Other: Package,
  "Testing & Quality": ShieldCheck,
};

function formatNumber(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function categoryTone(category: string) {
  if (category === "Frontend") return "bg-sky-50 text-sky-700 ring-sky-200";
  if (category === "AI & ML") return "bg-violet-50 text-violet-700 ring-violet-200";
  if (category === "Backend") return "bg-emerald-50 text-emerald-700 ring-emerald-200";
  if (category === "DevOps") return "bg-amber-50 text-amber-700 ring-amber-200";
  if (category === "Browser Automation") return "bg-rose-50 text-rose-700 ring-rose-200";
  return "bg-zinc-100 text-zinc-700 ring-zinc-200";
}

export default function Home() {
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isDarkPreview, setIsDarkPreview] = useState(true);

  const filteredSkills = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return skills.filter((skill) => {
      const categoryMatch =
        activeCategory === "All" || skill.category === activeCategory;
      const tagMatch = !activeTag || skill.tags.includes(activeTag);
      const queryMatch =
        !normalizedQuery ||
        [
          skill.name,
          skill.author,
          skill.repo ?? "",
          skill.description,
          skill.category,
          skill.source,
          skill.tags.join(" "),
        ]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);

      return categoryMatch && tagMatch && queryMatch;
    });
  }, [activeCategory, activeTag, query]);

  const displayedSkills = filteredSkills.slice(0, 48);

  async function copyCommand(skill: Skill) {
    await navigator.clipboard.writeText(skill.installCommand);
    setCopiedId(skill.id || skill.name);
    window.setTimeout(() => setCopiedId(null), 1600);
  }

  return (
    <main
      className={cn(
        "min-h-screen transition-colors",
        isDarkPreview ? "bg-[#0b1020] text-white" : "bg-[#f7f7f4] text-zinc-950"
      )}
    >
      <header
        className={cn(
          "sticky top-0 z-20 border-b backdrop-blur",
          isDarkPreview
            ? "border-white/10 bg-[#0b1020]/90"
            : "border-zinc-200 bg-[#f7f7f4]/90"
        )}
      >
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-2 font-semibold" href="#">
            <span className="grid size-8 place-items-center rounded-lg bg-violet-500 text-white">
              <Package className="size-4" />
            </span>
            Claude Directory
          </a>
          <nav
            className={cn(
              "hidden items-center gap-5 text-sm md:flex",
              isDarkPreview ? "text-zinc-300" : "text-zinc-600"
            )}
          >
            <a className="hover:text-violet-400" href="#directory">
              Directory
            </a>
            <a className="hover:text-violet-400" href="#categories">
              Categories
            </a>
            <a className="hover:text-violet-400" href="#source">
              Source
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button
              variant={isDarkPreview ? "secondary" : "outline"}
              size="icon"
              aria-label="Toggle theme preview"
              onClick={() => setIsDarkPreview((value) => !value)}
            >
              {isDarkPreview ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </Button>
            <Button asChild size="sm">
              <a href="https://github.com/rajvictor1/skills-marketplace-outskill">
                <GitFork className="size-4" />
                Repo
              </a>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid min-h-[560px] w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_440px] lg:px-8 lg:py-14">
        <div className="flex flex-col justify-center">
          <Badge className="mb-5 w-fit bg-violet-500/15 text-violet-300 hover:bg-violet-500/15">
            <Sparkles className="size-3" />
            Curated Claude skills directory
          </Badge>
          <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-normal sm:text-6xl">
            Discover Claude Code skills, tools, and extensions.
          </h1>
          <p
            className={cn(
              "mt-5 max-w-2xl text-lg leading-8",
              isDarkPreview ? "text-zinc-300" : "text-zinc-600"
            )}
          >
            A browsable directory of installable agent skills from skills.sh and
            Clawdhub, rebuilt inside your Next.js marketplace with fast search,
            category filters, tag filters, and copy-ready install commands.
          </p>

          <div
            className={cn(
              "mt-8 grid gap-3 rounded-lg border p-2 shadow-sm sm:grid-cols-[1fr_auto]",
              isDarkPreview
                ? "border-white/10 bg-white/5"
                : "border-zinc-200 bg-white"
            )}
          >
            <label className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
              <span className="sr-only">Search skills</span>
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                className={cn(
                  "h-11 border-0 pl-9 shadow-none focus-visible:ring-0",
                  isDarkPreview ? "bg-transparent text-white" : "bg-transparent"
                )}
                placeholder="Search names, authors, tags, or categories"
              />
              {query ? (
                <button
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-100"
                  onClick={() => setQuery("")}
                  type="button"
                  aria-label="Clear search"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </label>
            <Button className="h-11">
              <Filter className="size-4" />
              {filteredSkills.length} results
            </Button>
          </div>

          <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
            <div>
              <div className="text-2xl font-semibold">{directoryData.totalSkills}</div>
              <div className={cn("mt-1 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
                total tools
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{Object.keys(byCategory).length}</div>
              <div className={cn("mt-1 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
                categories
              </div>
            </div>
            <div>
              <div className="text-2xl font-semibold">{directoryData.bySource["skills.sh"]}</div>
              <div className={cn("mt-1 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
                skills.sh items
              </div>
            </div>
          </div>
        </div>

        <aside
          className={cn(
            "self-center rounded-lg border p-4 shadow-2xl",
            isDarkPreview
              ? "border-white/10 bg-white/[0.06] shadow-black/20"
              : "border-zinc-200 bg-white shadow-zinc-900/10"
          )}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Most installed</p>
              <p className={cn("text-xs", isDarkPreview ? "text-zinc-400" : "text-zinc-500")}>
                Updated {directoryData.generatedAt.slice(0, 10)}
              </p>
            </div>
            <Badge className="bg-violet-500 text-white hover:bg-violet-500">
              Live dataset
            </Badge>
          </div>
          <div className="mt-4 space-y-3">
            {skills.slice(0, 5).map((skill, index) => {
              const Icon = categoryIcons[skill.category] ?? Package;

              return (
                <a
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 transition",
                    isDarkPreview
                      ? "border-white/10 bg-black/15 hover:bg-white/10"
                      : "border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                  )}
                  href={skill.url}
                  key={skill.id || skill.name}
                  target="_blank"
                  rel="noreferrer"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-md bg-violet-500 text-xs font-semibold text-white">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{skill.name}</p>
                    <p className={cn("truncate text-xs", isDarkPreview ? "text-zinc-400" : "text-zinc-500")}>
                      {skill.author} · {formatNumber(skill.installs)} installs
                    </p>
                  </div>
                  <Icon className="size-4 text-violet-400" />
                </a>
              );
            })}
          </div>
        </aside>
      </section>

      <section
        className={cn(
          "border-y px-4 py-5 sm:px-6 lg:px-8",
          isDarkPreview ? "border-white/10 bg-white/[0.03]" : "border-zinc-200 bg-white"
        )}
        id="categories"
      >
        <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto pb-1">
          {categories.map((category) => (
            <Button
              key={category}
              size="sm"
              variant={activeCategory === category ? "default" : "outline"}
              onClick={() => setActiveCategory(category)}
              className={cn(
                "shrink-0",
                activeCategory !== category && isDarkPreview
                  ? "border-white/10 bg-transparent text-zinc-200 hover:bg-white/10"
                  : ""
              )}
            >
              {category}
              <span className="text-xs opacity-70">
                {category === "All" ? skills.length : byCategory[category]}
              </span>
            </Button>
          ))}
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8"
        id="directory"
      >
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-violet-400">Directory</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              {activeCategory === "All" ? "All skills and tools" : activeCategory}
            </h2>
            <p className={cn("mt-2 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
              Showing {displayedSkills.length} of {filteredSkills.length} matching items.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={activeTag === null ? "default" : "outline"}
              onClick={() => setActiveTag(null)}
              className={cn(
                activeTag !== null && isDarkPreview
                  ? "border-white/10 bg-transparent text-zinc-200 hover:bg-white/10"
                  : ""
              )}
            >
              All tags
            </Button>
            {featuredTags.map((tag) => (
              <Button
                key={tag}
                size="sm"
                variant={activeTag === tag ? "default" : "outline"}
                onClick={() => setActiveTag((current) => (current === tag ? null : tag))}
                className={cn(
                  activeTag !== tag && isDarkPreview
                    ? "border-white/10 bg-transparent text-zinc-200 hover:bg-white/10"
                    : ""
                )}
              >
                {tag}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {displayedSkills.map((skill) => {
            const Icon = categoryIcons[skill.category] ?? Package;
            const key = skill.id || skill.name;
            const description =
              skill.description ||
              `${skill.name} is listed in ${skill.category} from ${skill.source}.`;

            return (
              <Card
                className={cn(
                  "rounded-lg shadow-sm",
                  isDarkPreview
                    ? "border-white/10 bg-white/[0.06] text-white ring-white/10"
                    : "border-zinc-200"
                )}
                key={key}
              >
                <CardHeader>
                  <div className={cn("mb-3 grid size-10 place-items-center rounded-lg ring-1", categoryTone(skill.category))}>
                    <Icon className="size-5" />
                  </div>
                  <CardTitle className="truncate">{skill.name}</CardTitle>
                  <CardDescription className={isDarkPreview ? "text-zinc-400" : ""}>
                    {skill.author} · {skill.source}
                  </CardDescription>
                  <CardAction>
                    <Badge className="bg-violet-500/15 text-violet-300 hover:bg-violet-500/15">
                      {skill.category}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="min-h-36">
                  <p className={cn("line-clamp-3 text-sm leading-6", isDarkPreview ? "text-zinc-300" : "text-zinc-600")}>
                    {description}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {(skill.tags.length ? skill.tags : [skill.category]).slice(0, 4).map((tag) => (
                      <span
                        className={cn(
                          "rounded-md px-2 py-1 text-xs",
                          isDarkPreview ? "bg-white/10 text-zinc-300" : "bg-zinc-100 text-zinc-600"
                        )}
                        key={tag}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>
                <CardFooter className={cn("flex-col items-stretch gap-3", isDarkPreview ? "border-white/10 bg-black/20" : "bg-zinc-50")}>
                  <div className={cn("flex items-center justify-between text-xs", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
                    <span>{formatNumber(skill.installs)} installs</span>
                    <span>{skill.lastUpdated}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="min-w-0 flex-1 justify-start"
                      variant={isDarkPreview ? "secondary" : "outline"}
                      onClick={() => copyCommand(skill)}
                    >
                      {copiedId === key ? <Check className="size-4" /> : <Copy className="size-4" />}
                      <span className="truncate">{skill.installCommand}</span>
                    </Button>
                    <Button asChild size="icon" aria-label={`Open ${skill.name}`}>
                      <a href={skill.url} target="_blank" rel="noreferrer">
                        <ArrowUpRight className="size-4" />
                      </a>
                    </Button>
                  </div>
                </CardFooter>
              </Card>
            );
          })}
        </div>

        {filteredSkills.length === 0 ? (
          <div className="py-20 text-center">
            <Clipboard className="mx-auto size-10 text-zinc-400" />
            <h3 className="mt-4 text-lg font-semibold">No matching tools</h3>
            <p className={cn("mt-2 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
              Try a different category, tag, or search phrase.
            </p>
          </div>
        ) : null}
      </section>

      <footer
        className={cn(
          "border-t px-4 py-8 sm:px-6 lg:px-8",
          isDarkPreview ? "border-white/10" : "border-zinc-200"
        )}
        id="source"
      >
        <div className="mx-auto flex max-w-7xl flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-medium">Claude Directory</p>
            <p className={cn("mt-1 text-sm", isDarkPreview ? "text-zinc-400" : "text-zinc-600")}>
              Curated and published by Raj Victor for discovering Claude Code, Clawdbot, and AI-agent skills.
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild>
              <a href="https://github.com/rajvictor1/skills-marketplace-outskill" target="_blank" rel="noreferrer">
                Your repo
              </a>
            </Button>
          </div>
        </div>
        <Separator className={cn("mx-auto mt-8 max-w-7xl", isDarkPreview ? "bg-white/10" : "")} />
      </footer>
    </main>
  );
}
