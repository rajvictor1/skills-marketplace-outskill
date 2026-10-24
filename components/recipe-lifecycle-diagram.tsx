import { ArrowDown, ArrowRight, Download, FileCheck2, SearchCheck, ShieldCheck, UserRoundPlus } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Creator submits",
    description: "A creator uploads an accepted recipe file or ZIP and selects a category and reuse terms.",
    icon: UserRoundPlus,
    tone: "bg-category-violet text-primary",
  },
  {
    number: "02",
    title: "Checks run",
    description: "The platform validates the package and runs static security checks. It does not execute the recipe.",
    icon: FileCheck2,
    tone: "bg-category-teal text-safe",
  },
  {
    number: "03",
    title: "Admin reviews",
    description: "An administrator reviews the submitted version and its scan results before deciding what happens next.",
    icon: SearchCheck,
    tone: "bg-category-peach text-caution",
  },
  {
    number: "04",
    title: "Decision is applied",
    description: "Approved recipes become public. Pending, rejected or blocked submissions remain private.",
    icon: ShieldCheck,
    tone: "bg-category-blue text-primary",
  },
  {
    number: "05",
    title: "User adopts",
    description: "A user inspects and downloads the approved recipe, then chooses how to use it in their own environment.",
    icon: Download,
    tone: "bg-safe/10 text-safe",
  },
];

export function RecipeLifecycleDiagram() {
  return (
    <section
      aria-labelledby="recipe-lifecycle-heading"
      className="mx-auto mb-16 mt-2 max-w-7xl px-5 sm:px-8"
    >
      <div className="rounded-[2rem] border border-border bg-card p-5 shadow-[0_20px_60px_#11153a12] sm:p-8 lg:p-10">
        <p className="editorial-kicker text-primary">Trigger and flow</p>
        <h2 id="recipe-lifecycle-heading" className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">
          From recipe submission to real-world use
        </h2>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">
          The trigger is a creator submitting a recipe. Automated checks and a human review happen before anything enters the public catalog.
        </p>

        <ol className="mt-8 grid gap-5 xl:grid-cols-5" aria-label="Recipe lifecycle">
          {steps.map(({ number, title, description, icon: Icon, tone }, index) => (
            <li key={number} className="relative min-w-0 rounded-2xl border border-border bg-background/70 p-5">
              {index < steps.length - 1 && (
                <>
                  <ArrowRight
                    aria-hidden="true"
                    className="absolute -right-[1.28rem] top-1/2 z-10 hidden size-4 -translate-y-1/2 text-primary xl:block"
                  />
                  <ArrowDown
                    aria-hidden="true"
                    className="absolute -bottom-[1.28rem] left-1/2 z-10 size-4 -translate-x-1/2 text-primary xl:hidden"
                  />
                </>
              )}
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold tracking-[0.16em] text-muted-foreground">{number}</span>
                <span className={`flex size-10 items-center justify-center rounded-xl ${tone}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
              </div>
              <h3 className="mt-5 text-base font-semibold">{title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>
        <p className="mt-6 rounded-xl border border-caution/25 bg-caution/10 px-4 py-3 text-sm leading-6 text-foreground">
          Review reduces risk; it does not guarantee a recipe is safe or suitable for every agent or environment.
        </p>
      </div>
    </section>
  );
}
