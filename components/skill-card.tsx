import Link from "next/link";
import { ArrowUpRight, Download, BadgeCheck, Sparkles } from "lucide-react";
import { RatingSummary } from "@/components/community-reviews";
import { TrustBadge } from "@/components/trust-badge";
import type { SampleSkill } from "@/lib/sample-data";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";
const TONES = [
  "bg-category-violet text-primary",
  "bg-category-teal text-safe",
  "bg-category-peach text-peach",
  "bg-category-blue text-blue",
];
export function SkillCard({ skill }: { skill: SampleSkill }) {
  const tone =
    TONES[
      Math.max(
        0,
        SKILL_CATEGORY_NAMES.findIndex((c) => c === skill.category),
      ) % TONES.length
    ];
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex min-h-80 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:hover:translate-y-0"
    >
      <div
        className={`flex min-h-28 items-center justify-between gap-3 p-6 ${tone}`}
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest">
            {skill.category}
          </p>
          <span className="mt-3 flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Sparkles className="size-5" aria-hidden />
          </span>
        </div>
        <ArrowUpRight
          className="size-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none"
          aria-hidden
        />
      </div>
      <div className="flex flex-1 flex-col p-6">
        <div className="flex flex-wrap items-center gap-2">
          {skill.metadata?.isSample ? (
            <span className="text-xs font-semibold text-primary">
              Curated example · Untested
            </span>
          ) : (
            <TrustBadge tier={skill.trustTier} />
          )}
          {skill.adminApproved && (
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-safe">
              <BadgeCheck className="size-3.5" aria-hidden />
              Admin approved
            </span>
          )}
        </div>
        <h3 className="mt-4 text-xl font-semibold tracking-tight group-hover:text-primary">
          {skill.name}
        </h3>
        <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {skill.summary}
        </p>
        <div className="mt-5">
          {!skill.metadata?.isSample && (
            <RatingSummary
              average={skill.ratingAverage ?? 0}
              count={skill.ratingCount ?? 0}
            />
          )}
        </div>
        <div className="mt-5 flex items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground">
          <span className="truncate">By {skill.author.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {skill.metadata?.isSample ? (
              "Preview example"
            ) : (
              <>
                <Download className="size-3.5" aria-hidden />
                {skill.installs.toLocaleString()} downloads
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
