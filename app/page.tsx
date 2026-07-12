import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Boxes,
  ChevronRight,
  CircleAlert,
  Code2,
  Download,
  Eye,
  FileScan,
  Filter,
  GitFork,
  LockKeyhole,
  Search,
  Shield,
  ShieldAlert,
  Sparkles,
  TerminalSquare,
  UploadCloud,
} from "lucide-react";

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

const categories = [
  "All",
  "Coding",
  "Data",
  "Docs",
  "Research",
  "Automation",
  "Security",
];

const skills = [
  {
    name: "Repo Review Pilot",
    author: "Avery Chen",
    category: "Coding",
    description:
      "Reviews pull requests with a compact checklist for correctness, tests, accessibility, and risky changes.",
    tier: "Verified safe",
    scans: "4 clean layers",
    downloads: "12.8k",
    icon: Code2,
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  },
  {
    name: "Dataset Cartographer",
    author: "Mira Patel",
    category: "Data",
    description:
      "Profiles CSV and spreadsheet uploads, flags schema drift, and drafts transformation notes for analysts.",
    tier: "Verified safe",
    scans: "No hidden text",
    downloads: "8.4k",
    icon: Boxes,
    tone: "bg-sky-50 text-sky-700 ring-sky-200",
  },
  {
    name: "Grant Draft Studio",
    author: "Northstar Lab",
    category: "Docs",
    description:
      "Builds first-pass grant narratives from a funder brief, prior proposals, and budget notes.",
    tier: "Caution",
    scans: "1 script heuristic",
    downloads: "5.1k",
    icon: BookOpen,
    tone: "bg-amber-50 text-amber-700 ring-amber-200",
  },
];

const scannerLayers = [
  {
    label: "Hidden text",
    value: "Unicode tags, zero-width characters, and bidi overrides",
    state: "Passed",
  },
  {
    label: "Dangerous patterns",
    value: "Prompt overrides, secret reads, and exfiltration language",
    state: "Passed",
  },
  {
    label: "Script analysis",
    value: "Network calls, subprocess usage, obfuscation, curl pipes",
    state: "Review",
  },
  {
    label: "LLM classifier",
    value: "Best-effort structured triage with conservative weighting",
    state: "Passed",
  },
];

const stats = [
  { label: "Public skills", value: "1,284" },
  { label: "Blocked submissions", value: "318" },
  { label: "Clean scan rate", value: "76%" },
];

export default function Home() {
  return (
    <main className="min-h-screen bg-[#f7f7f4] text-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-[#f7f7f4]/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <a className="flex items-center gap-2 font-semibold" href="#">
            <span className="grid size-8 place-items-center rounded-lg bg-zinc-950 text-white">
              <Shield className="size-4" />
            </span>
            Outskill
          </a>
          <nav className="hidden items-center gap-6 text-sm text-zinc-600 md:flex">
            <a className="hover:text-zinc-950" href="#marketplace">
              Marketplace
            </a>
            <a className="hover:text-zinc-950" href="#scanner">
              Scanner
            </a>
            <a className="hover:text-zinc-950" href="#publish">
              Publish
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" aria-label="Open GitHub">
              <GitFork className="size-4" />
            </Button>
            <Button size="sm">
              <UploadCloud className="size-4" />
              Submit
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-zinc-200">
        <div className="mx-auto grid min-h-[620px] w-full max-w-7xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_460px] lg:px-8 lg:py-14">
          <div className="flex flex-col justify-center">
            <Badge className="mb-5 w-fit bg-emerald-100 text-emerald-900 hover:bg-emerald-100">
              <BadgeCheck className="size-3" />
              Security-first skill discovery
            </Badge>
            <h1 className="max-w-3xl text-5xl font-semibold leading-[1.04] tracking-normal text-zinc-950 sm:text-6xl">
              Browse AI-agent skills with visible trust signals.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-zinc-600">
              Outskill vets every submitted skill before it reaches the catalog,
              then shows the scanner evidence that matters: hidden text checks,
              dangerous patterns, script heuristics, and LLM triage.
            </p>

            <div className="mt-8 flex w-full max-w-2xl flex-col gap-3 rounded-lg border border-zinc-200 bg-white p-2 shadow-sm sm:flex-row">
              <label className="relative flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-zinc-400" />
                <span className="sr-only">Search skills</span>
                <Input
                  className="h-11 border-0 bg-transparent pl-9 shadow-none focus-visible:ring-0"
                  placeholder="Search skills, authors, or trust tiers"
                />
              </label>
              <Button className="h-11 px-4">
                Search catalog
                <ArrowRight className="size-4" />
              </Button>
            </div>

            <div className="mt-8 grid max-w-2xl grid-cols-3 gap-4">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <div className="text-2xl font-semibold">{stat.value}</div>
                  <div className="mt-1 text-sm text-zinc-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center">
            <div className="w-full rounded-lg border border-zinc-200 bg-zinc-950 p-4 text-white shadow-2xl shadow-zinc-900/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <div className="flex items-center gap-2">
                  <span className="grid size-8 place-items-center rounded-md bg-emerald-400 text-zinc-950">
                    <FileScan className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Live scan report</p>
                    <p className="text-xs text-zinc-400">skill-bundle.zip</p>
                  </div>
                </div>
                <Badge className="bg-emerald-400 text-zinc-950 hover:bg-emerald-400">
                  Verified safe
                </Badge>
              </div>

              <div className="space-y-3 py-4">
                {scannerLayers.map((layer) => (
                  <div
                    className="rounded-lg border border-white/10 bg-white/[0.04] p-3"
                    key={layer.label}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-sm font-medium">{layer.label}</p>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">
                          {layer.value}
                        </p>
                      </div>
                      <span
                        className={
                          layer.state === "Review"
                            ? "rounded-md bg-amber-300 px-2 py-1 text-xs font-medium text-zinc-950"
                            : "rounded-md bg-emerald-300 px-2 py-1 text-xs font-medium text-zinc-950"
                        }
                      >
                        {layer.state}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-3 rounded-lg bg-white p-3 text-zinc-950">
                <div>
                  <p className="text-sm font-medium">Publish decision</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-600">
                    Eligible for catalog listing with one reviewer note attached
                    to the script heuristic.
                  </p>
                </div>
                <Button size="icon" aria-label="View scan details">
                  <Eye className="size-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8"
        id="marketplace"
      >
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div>
            <p className="text-sm font-medium text-emerald-700">Marketplace</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Featured skills ready to inspect
            </h2>
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-1">
            <Button variant="outline" size="icon" aria-label="Filter skills">
              <Filter className="size-4" />
            </Button>
            {categories.map((category) => (
              <Button
                key={category}
                variant={category === "All" ? "default" : "outline"}
                size="sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        <div className="mt-7 grid gap-4 md:grid-cols-3">
          {skills.map((skill) => {
            const Icon = skill.icon;

            return (
              <Card className="rounded-lg border-zinc-200 shadow-sm" key={skill.name}>
                <CardHeader>
                  <div
                    className={`mb-3 grid size-10 place-items-center rounded-lg ring-1 ${skill.tone}`}
                  >
                    <Icon className="size-5" />
                  </div>
                  <CardTitle>{skill.name}</CardTitle>
                  <CardDescription>
                    {skill.category} by {skill.author}
                  </CardDescription>
                  <CardAction>
                    <Badge
                      className={
                        skill.tier === "Caution"
                          ? "bg-amber-100 text-amber-900 hover:bg-amber-100"
                          : "bg-emerald-100 text-emerald-900 hover:bg-emerald-100"
                      }
                    >
                      {skill.tier === "Caution" ? (
                        <ShieldAlert className="size-3" />
                      ) : (
                        <BadgeCheck className="size-3" />
                      )}
                      {skill.tier}
                    </Badge>
                  </CardAction>
                </CardHeader>
                <CardContent className="min-h-28">
                  <p className="text-sm leading-6 text-zinc-600">
                    {skill.description}
                  </p>
                </CardContent>
                <CardFooter className="justify-between bg-zinc-50">
                  <div className="flex items-center gap-4 text-xs text-zinc-600">
                    <span className="flex items-center gap-1">
                      <FileScan className="size-3.5" />
                      {skill.scans}
                    </span>
                    <span className="flex items-center gap-1">
                      <Download className="size-3.5" />
                      {skill.downloads}
                    </span>
                  </div>
                  <Button variant="ghost" size="icon-sm" aria-label="Open skill">
                    <ChevronRight className="size-4" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="border-y border-zinc-200 bg-white" id="scanner">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[420px_1fr] lg:px-8">
          <div>
            <p className="text-sm font-medium text-emerald-700">Scanner</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-normal">
              Trust tiers built from evidence, not vibes.
            </h2>
            <p className="mt-4 leading-7 text-zinc-600">
              The scanner blocks severe submissions, marks ambiguous bundles for
              caution, and keeps the full finding trail visible for reviewers.
            </p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5">
              <BadgeCheck className="size-5 text-emerald-700" />
              <h3 className="mt-4 font-semibold">Verified safe</h3>
              <p className="mt-2 text-sm leading-6 text-emerald-950/75">
                Deterministic checks pass and model triage finds no injection
                signal.
              </p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <CircleAlert className="size-5 text-amber-700" />
              <h3 className="mt-4 font-semibold">Caution</h3>
              <p className="mt-2 text-sm leading-6 text-amber-950/75">
                Heuristics need reviewer context, but the bundle is still safe
                enough to inspect.
              </p>
            </div>
            <div className="rounded-lg border border-red-200 bg-red-50 p-5">
              <LockKeyhole className="size-5 text-red-700" />
              <h3 className="mt-4 font-semibold">Blocked</h3>
              <p className="mt-2 text-sm leading-6 text-red-950/75">
                High-confidence prompt injection or secret access attempts never
                reach public browsing.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section
        className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_380px] lg:px-8"
        id="publish"
      >
        <div className="rounded-lg border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium text-emerald-700">Publish flow</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-normal">
                Submit a skill bundle for review
              </h2>
            </div>
            <Button>
              <UploadCloud className="size-4" />
              Upload SKILL.md
            </Button>
          </div>
          <Separator className="my-5" />
          <div className="grid gap-3 md:grid-cols-3">
            {["Parse metadata", "Run scanner", "Assign trust badge"].map(
              (step, index) => (
                <div
                  className="flex min-h-24 flex-col justify-between rounded-lg border border-zinc-200 p-4"
                  key={step}
                >
                  <span className="text-sm text-zinc-500">Step {index + 1}</span>
                  <span className="font-medium">{step}</span>
                </div>
              )
            )}
          </div>
        </div>

        <aside className="rounded-lg border border-zinc-200 bg-zinc-950 p-5 text-white">
          <Sparkles className="size-5 text-emerald-300" />
          <h3 className="mt-4 text-xl font-semibold">Open source beta</h3>
          <p className="mt-3 text-sm leading-6 text-zinc-300">
            The current product is free and focused on trustworthy discovery,
            transparent scanner output, and a clean path to installable agent
            skills.
          </p>
          <div className="mt-5 flex gap-2">
            <Button className="bg-white text-zinc-950 hover:bg-zinc-200">
              <TerminalSquare className="size-4" />
              CLI soon
            </Button>
            <Button variant="outline" className="border-white/20 bg-transparent text-white hover:bg-white/10">
              <GitFork className="size-4" />
              Star
            </Button>
          </div>
        </aside>
      </section>
    </main>
  );
}
