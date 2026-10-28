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
export function SkillCard({
  skill,
  variant = "default",
  layout = "grid",
}: {
  skill: SampleSkill;
  variant?: "default" | "marketplace";
  layout?: "grid" | "list";
}) {
  const marketplace = variant === "marketplace";
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
      className={
        marketplace
          ? `group flex min-w-0 flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:hover:translate-y-0 ${layout === "list" ? "sm:flex-row" : ""}`
          : "group flex min-h-80 flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform hover:-translate-y-1 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary motion-reduce:hover:translate-y-0"
      }
    >
      {marketplace ? (
        <div className={`flex items-center gap-3 border-b border-border/70 px-5 py-4 ${tone}`}>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-card/75 shadow-sm">
            <Sparkles className="size-5" aria-hidden />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-foreground">{skill.category}</p>
            <p className="truncate text-xs text-muted-foreground">{skill.subcategory || "AI agent recipe"}</p>
          </div>
          <ArrowUpRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
        </div>
      ) : (
        <div className={`flex min-h-28 items-center justify-between gap-3 p-6 ${tone}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest">{skill.category}</p>
            <span className="mt-3 flex size-10 items-center justify-center rounded-xl bg-primary/10"><Sparkles className="size-5" aria-hidden /></span>
          </div>
          <ArrowUpRight className="size-5 transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 motion-reduce:transform-none" aria-hidden />
        </div>
      )}
      <div className={`flex min-w-0 flex-1 flex-col ${marketplace ? "p-5" : "p-6"}`}>
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
        <h3 className={`${marketplace ? "mt-3 text-lg" : "mt-4 text-xl"} font-semibold tracking-tight group-hover:text-primary`}>
          {skill.name}
        </h3>
        <p className={`mt-2 ${marketplace ? "line-clamp-2" : "line-clamp-3"} text-sm leading-relaxed text-muted-foreground`}>
          {skill.summary}
        </p>
        <div className={`${marketplace ? "mt-3" : "mt-5"}`}>
          {!skill.metadata?.isSample && (
            <RatingSummary
              average={skill.ratingAverage ?? 0}
              count={skill.ratingCount ?? 0}
            />
          )}
        </div>
        <div className={`${marketplace ? "mt-4" : "mt-5"} flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-xs text-muted-foreground`}>
          <span className="truncate">By {skill.author.name}</span>
          <span className="inline-flex shrink-0 items-center gap-1">
            {skill.metadata?.isSample ? (
              "Preview example"
            ) : (
              <>
                <Download className="size-3.5" aria-hidden />
                {skill.installs.toLocaleString()} recorded download requests
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
