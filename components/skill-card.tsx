import Link from "next/link";
import { Download } from "lucide-react";

import { TrustBadge } from "@/components/trust-badge";
import type { SampleSkill } from "@/lib/sample-data";

function formatInstalls(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return `${n}`;
}

export function SkillCard({ skill }: { skill: SampleSkill }) {
  return (
    <Link
      href={`/skills/${skill.slug}`}
      className="group flex flex-col rounded-2xl border border-border bg-card p-5 transition-colors hover:border-primary/40 focus-visible:border-primary/40 focus-visible:outline-none"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
          {skill.category}
        </span>
        <TrustBadge tier={skill.trustTier} />
      </div>

      <h3 className="mt-4 text-base font-semibold tracking-tight text-foreground group-hover:text-primary">
        {skill.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {skill.summary}
      </p>

      {skill.tags?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{skill.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}</div> : null}

      <div className="mt-4 flex items-center gap-3 border-t border-border/70 pt-4">
        <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground">
          {skill.author.initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium text-foreground">
            {skill.author.name}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {skill.author.role}
          </p>
        </div>
        {skill.metadata && !skill.metadata.isSample ? <span className="text-right text-[10px] leading-tight text-muted-foreground">Install tracking<br />not connected</span> : <span className="flex items-center gap-1 font-mono text-xs text-muted-foreground"><Download className="size-3.5" aria-hidden />{formatInstalls(skill.installs)}</span>}
      </div>
    </Link>
  );
}
