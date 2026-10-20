import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Eye,
  FileWarning,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { ScanPreview } from "@/components/scan-preview";
import { SkillCard } from "@/components/skill-card";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { CategoryDirectory } from "@/components/category-directory";
import { SAMPLE_SKILLS, CATALOG_STATS } from "@/lib/sample-data";
import { SCAN_LAYERS } from "@/lib/trust";

const LAYER_ICONS = {
  hidden_text: Eye,
  dangerous_pattern: FileWarning,
  script_analysis: TerminalSquare,
  llm_injection: Bot,
} as const;

export default function Home() {
  const featured = SAMPLE_SKILLS.slice(0, 3);

  return (
    <main className="overflow-hidden">
      <section className="brand-hero dark-surface relative px-5 pb-24 pt-20 text-foreground sm:px-8 sm:pt-28 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-medium text-white/90 backdrop-blur-md">
              <ShieldCheck className="size-4 text-[#a9ead2]" aria-hidden />
              A more thoughtful home for AI agent skills
            </span>
            <h1 className="mt-9 text-balance text-[clamp(3.2rem,7.5vw,7.4rem)] font-semibold leading-[0.99] tracking-[-0.065em] text-white">
              Discover skills.<br />
              <span className="text-[#b9c6ff]">Know what&apos;s inside.</span>
            </h1>
            <p className="mx-auto mt-8 max-w-2xl text-balance text-lg leading-relaxed text-[#d9dbf0] sm:text-xl">
              Explore useful AI agent skills, see how each one was reviewed, and publish your own expertise in one curated marketplace.
            </p>
            <div className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="/skills" className="brand-button inline-flex h-13 min-w-44 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold">
                Explore skills <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link href="/publish" className="inline-flex h-13 min-w-44 items-center justify-center gap-2 rounded-full border border-white/50 px-7 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white">
                Publish a skill <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <p className="mt-12 text-xs font-medium uppercase tracking-[0.2em] text-[#aeb1d2]">Built for creators · teams · AI builders</p>
          </div>

          <div className="relative mx-auto mt-12 max-w-5xl rounded-[2rem] border border-white/20 bg-white/10 p-2 shadow-[0_32px_100px_#06091f99] sm:mt-16 sm:p-3">
            <div className="absolute inset-x-16 -top-12 -z-10 h-36 rounded-full bg-[#5875ff]/30 blur-3xl" aria-hidden />
            <ScanPreview />
          </div>
          <p className="mt-5 text-center text-xs text-[#b6b9d2]">A product preview of Skillbuffet&apos;s scanner. The example shown is a blocked submission.</p>
        </div>
      </section>

      <section className="bg-white px-5 py-24 text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
          <div>
            <p className="editorial-kicker text-primary">One clear place to start</p>
            <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              From a useful idea to a skill people can trust.
            </h2>
          </div>
          <div className="lg:pt-9">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Skillbuffet brings discovery, review, and publishing together. Find a skill by the work it helps you do, read its instructions, and inspect its security result before you install it.
            </p>
            <Link href="#categories" className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Explore all 18 categories <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <CategoryDirectory compact />

      <section className="bg-[#f3f5fb] px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="editorial-kicker text-primary">How Skillbuffet works</p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">A simple journey, with the details that matter.</h2>
          </div>
          <div className="mt-14 grid gap-0 border-y border-border lg:grid-cols-3">
            {[
              ["01", "Discover", "Browse skills by category, search for a use case, and compare what each one does."],
              ["02", "Inspect", "Read the skill and its scan findings before deciding whether it belongs in your agent."],
              ["03", "Publish", "Submit your own skill. Critical findings block publication until the issue is resolved."],
            ].map(([number, title, description]) => (
              <div key={number} className="border-b border-border py-9 last:border-b-0 lg:border-b-0 lg:border-r lg:px-9 lg:first:pl-0 lg:last:border-r-0">
                <span className="font-mono text-xs font-semibold text-primary">{number}</span>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">{title}</h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-surface bg-[#111236] px-5 py-24 text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="editorial-kicker text-[#aebcff]">The review layer</p>
              <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">Good skills deserve a closer look.</h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-[#c8cae1] lg:pb-2">Every submission passes four automated checks for hidden instructions, risky patterns, scripts, and prompt injection. A critical finding blocks publication.</p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[1.8rem] border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-4">
            {SCAN_LAYERS.map((layer, index) => {
              const Icon = LAYER_ICONS[layer.key];
              return <div key={layer.key} className="bg-[#1b1d49] p-7 sm:p-8">
                <span className="flex size-11 items-center justify-center rounded-full bg-[#aebcff]/15 text-[#b9c6ff]"><Icon className="size-5" aria-hidden /></span>
                <span className="mt-8 block font-mono text-xs text-[#aeb1d2]">0{index + 1} / 04</span>
                <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em]">{layer.name}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#bfc1d7]">{layer.blurb}</p>
              </div>;
            })}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-[#bfc1d7]">Automated scanning reduces risk; it cannot guarantee that every skill is safe. Always review permissions and code before installing.</p>
          <Link href="/security" className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-[#c2cdff] hover:underline">See how vetting works <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>

      <section className="bg-white px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="editorial-kicker text-primary">Marketplace preview</p>
              <h2 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">Find your next useful skill.</h2>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">Explore example skills across marketing, sales, and technical workflows.</p>
            </div>
            <Button size="lg" asChild className="brand-button h-11 rounded-full px-6"><Link href="/skills">Browse all skills <ArrowRight className="size-4" aria-hidden /></Link></Button>
          </div>
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((skill) => <SkillCard key={skill.id} skill={skill} />)}
          </div>
          <div className="mt-8 max-w-3xl"><DemoDataNotice>These skill cards are example content for preview. Their install counts are not live platform analytics.</DemoDataNotice></div>
        </div>
      </section>

      <section className="bg-[#f3f5fb] px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-5 max-w-3xl"><DemoDataNotice>The figures below are example values for this preview, not live customer or platform analytics.</DemoDataNotice></div>
          <div className="grid grid-cols-2 gap-8 border-t border-border pt-10 lg:grid-cols-4">
            <Stat value={CATALOG_STATS.scansRun.toLocaleString()} label="Example scans run" />
            <Stat value={`${CATALOG_STATS.blockedThisWeek}`} label="Example skills blocked" />
            <Stat value={`${CATALOG_STATS.verifiedProfessionals}`} label="Example professionals" />
            <Stat value="4" label="Checks on every submission" />
          </div>
        </div>
      </section>

      <section className="brand-hero dark-surface px-5 py-24 text-center text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl">
          <BadgeCheck className="mx-auto size-11 text-[#b7c7ff]" aria-hidden />
          <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-6xl">Your expertise deserves a better home.</h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-[#d8daef]">Publish an AI agent skill, see its review result, and make it discoverable to the people who need it.</p>
          <Link href="/publish" className="brand-button mt-9 inline-flex h-13 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold">Publish a skill <ArrowRight className="size-4" aria-hidden /></Link>
        </div>
      </section>
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return <div><p className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">{value}</p><p className="mt-2 text-sm text-muted-foreground">{label}</p></div>;
}
