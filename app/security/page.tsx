import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";

import Link from "next/link";
import {
  ArrowRight,
  Eye,
  FileWarning,
  TerminalSquare,
  Bot,
  ShieldOff,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { ScanPreview } from "@/components/scan-preview";
import { TrustBadge } from "@/components/trust-badge";
import { LiveScanner } from "@/components/live-scanner";
import { SCAN_LAYERS, type TrustTier } from "@/lib/trust";

export const metadata = staticMetadata("/security", true);

const LAYER_ICONS: Record<(typeof SCAN_LAYERS)[number]["key"], LucideIcon> = {
  hidden_text: Eye,
  dangerous_pattern: FileWarning,
  script_analysis: TerminalSquare,
  llm_injection: Bot,
};

// The three outcomes a scan can produce, in the order a submission moves through
// them. "pending" is a transient state, not an outcome, so it is omitted here.
const OUTCOME_TIERS: TrustTier[] = ["verified_safe", "caution", "blocked"];

export default function SecurityPage() {
  return (
    <main>
      <PageSeo
        path="/security"
        {...PUBLIC_PAGES["/security"]}
        crumbs={[{ name: "Security and review", path: "/security" }]}
      />
      <div className="col-span-full mx-auto w-full max-w-7xl px-5 pt-6">
        <Breadcrumbs
          items={[{ name: "Security and review", path: "/security" }]}
        />
      </div>
      {/* --------------------------------------------------------------- hero */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pb-16 pt-16 sm:px-6 lg:grid-cols-[1fr_1.05fr] lg:gap-10 lg:pt-24">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            How vetting works
          </p>
          <h1 className="mt-4 text-balance text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
            How we vet every recipe
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Before publication, a recipe package is checked for required files,
            schemas, and suspicious content. Three static security layers inspect
            its instructions and scripts without running them. An administrator
            then reviews the submitted version and decides whether to publish it.
            A scan does not verify that a recipe works in your environment.
          </p>
        </div>

        <div className="lg:pl-4">
          <ScanPreview />
        </div>
      </section>

      {/* -------------------------------------------------------- four layers */}
      <section className="border-t border-border/80 bg-card/40">
        <div className="mx-auto max-w-3xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
              The scanner
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Three static checks, plus an optional classifier
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              The first three layers inspect submitted files and combine their
              findings into a risk score. The optional AI classifier is not used
              for recipe ZIP packages; those receive static checks only.
            </p>
          </div>

          {/* Vertical stepped timeline — a deliberately different treatment than
              the homepage's four-column grid. */}
          <ol className="mt-12 space-y-px">
            {SCAN_LAYERS.map((layer, i) => {
              const Icon = LAYER_ICONS[layer.key];
              const isLast = i === SCAN_LAYERS.length - 1;
              return (
                <li key={layer.key} className="relative flex gap-5 pb-8">
                  {/* connector rail */}
                  {!isLast && (
                    <span
                      className="absolute left-6 top-14 h-[calc(100%-3.5rem)] w-px bg-border"
                      aria-hidden
                    />
                  )}
                  <div className="relative flex flex-col items-center">
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary ring-1 ring-inset ring-primary/10">
                      <Icon className="size-5" aria-hidden />
                    </span>
                  </div>
                  <div className="flex-1 rounded-2xl border border-border bg-card p-5">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">
                        Layer 0{i + 1}
                      </span>
                      <h3 className="text-base font-semibold text-foreground">
                        {layer.name}
                      </h3>
                    </div>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                      {layer.blurb}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* --------------------------------------------------- try it yourself */}
      <section className="border-t border-border/80">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Try the scanner yourself
            </h2>
            <p className="mt-4 text-base leading-relaxed text-muted-foreground">
              This server-side demo scans pasted text. You can start from the
              malicious example to see a hidden payload detected. The demo
              does not validate a full ZIP package or run a recipe.
            </p>
          </div>
          <div className="mt-10">
            <LiveScanner />
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- trust tiers */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="max-w-2xl">
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-primary">
            The outcome
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Three scan outcomes
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Every scan resolves to one of three outcomes. The same badge and the
            same words follow the recipe across the catalog and its detail page.
            A badge is a scan result, not proof of runtime safety.
          </p>
        </div>

        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {OUTCOME_TIERS.map((tier) => (
            <div
              key={tier}
              className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5"
            >
              <TrustBadge tier={tier} showBlurb />
              <p className="text-sm leading-relaxed text-muted-foreground">
                {tier === "verified_safe" &&
                  "No high-risk findings in the checks that ran. The scan badge is separate from administrator approval; a version stays private until it is approved."}
                {tier === "caution" &&
                  "The scanner flagged findings or could not verify runtime behavior. An administrator may publish a reviewed recipe with this caution badge."}
                {tier === "blocked" &&
                  "A critical finding, like a hidden instruction payload or remote code execution. This version cannot be approved until the creator corrects it and resubmits."}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ----------------------------------------------------- honesty callout */}
      <section className="mx-auto max-w-3xl px-4 pb-20 sm:px-6">
        <Alert className="border-caution/25 bg-caution/10 text-caution">
          <ShieldOff className="size-4" aria-hidden />
          <AlertTitle className="text-caution">What we do not claim</AlertTitle>
          <AlertDescription className="text-foreground/80">
            Prompt injection is not a fully solved problem. Static checks can
            flag some patterns, but they cannot determine overall safety. The
            checks may miss issues, and submitted scripts are never executed.
            Treat the badge as a summary of checks that ran, not a safety
            certification. Read the findings before downloading or using a
            recipe.
          </AlertDescription>
        </Alert>
      </section>

      {/* ----------------------------------------------------------- closing cta */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
        <div className="rounded-2xl border border-border bg-card/40 px-6 py-12 text-center sm:px-12">
          <h2 className="mx-auto max-w-2xl text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            See the badges in the wild.
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-base text-muted-foreground">
            Browse administrator-approved recipes, or submit your own for
            package checks, static scanning, and human review.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button size="lg" asChild>
              <Link href="/skills">
                Browse recipes
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link href="/publish">Publish a recipe</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
