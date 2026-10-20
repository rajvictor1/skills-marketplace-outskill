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
      className="group flex min-h-64 flex-col rounded-[1.5rem] border border-border bg-card p-6 shadow-[0_8px_35px_#11153a0a] transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-[0_18px_45px_#11153a1a] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary motion-reduce:hover:translate-y-0"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-secondary-foreground">
          {skill.category}
        </span>
        <TrustBadge tier={skill.trustTier} />
      </div>

      <h3 className="mt-7 text-lg font-semibold tracking-[-0.035em] text-foreground group-hover:text-primary">
        {skill.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
        {skill.summary}
      </p>

      {skill.tags?.length ? <div className="mt-3 flex flex-wrap gap-1.5">{skill.tags.slice(0, 3).map((tag) => <span key={tag} className="rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">{tag}</span>)}</div> : null}

      <div className="mt-auto flex items-center gap-3 border-t border-border/70 pt-5">
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
