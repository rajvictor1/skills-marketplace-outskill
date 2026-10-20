import { ArrowUpRight, Download, Workflow } from "lucide-react";

import type { WorkflowTemplate } from "@/lib/workflows/templates";

export function WorkflowTemplateCard({ template }: { template: WorkflowTemplate }) {
  return (
    <article className="overflow-hidden rounded-[1.75rem] border border-border bg-white shadow-[0_12px_40px_#11153a0c]">
      <div className="grid lg:grid-cols-[1fr_0.85fr]">
        <div className="p-7 sm:p-9">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-foreground"><Workflow className="size-3.5" aria-hidden /> n8n workflow</span>
            <span className="rounded-full border border-[#e6c8a7] bg-[#fff7ed] px-3 py-1.5 text-xs font-semibold text-[#8e531e]">Setup required</span>
          </div>
          <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em] text-foreground sm:text-3xl">{template.title}</h3>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">{template.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2">
            {template.integrations.map((item) => <span key={item} className="rounded-full border border-border bg-[#f6f7fb] px-3 py-1.5 text-xs font-medium text-foreground">{item}</span>)}
          </div>
          <p className="mt-6 text-xs text-muted-foreground">{template.nodeCount} nodes · {template.subcategory} · Original creator: {template.author}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <a href={template.downloadUrl} download className="brand-button inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold"><Download className="size-4" aria-hidden /> Download JSON</a>
            <a href={template.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-5 text-sm font-semibold text-foreground hover:border-primary/40 hover:text-primary">View original on n8n <ArrowUpRight className="size-4" aria-hidden /></a>
          </div>
        </div>
        <div className="border-t border-border bg-[#f6f7fb] p-7 sm:p-9 lg:border-l lg:border-t-0">
          <p className="editorial-kicker text-primary">Before you use it</p>
          <ol className="mt-5 space-y-4">
            {template.setup.map((step, index) => <li key={step} className="flex gap-3 text-sm leading-relaxed text-foreground"><span className="font-mono text-xs font-semibold text-primary">0{index + 1}</span><span>{step}</span></li>)}
          </ol>
          <p className="mt-6 border-t border-border pt-5 text-xs leading-relaxed text-muted-foreground">The supplied JSON was checked for structure and placeholders. It has not been connected to accounts or run in n8n. Keep API keys in your n8n credentials, never in a shared JSON file.</p>
        </div>
      </div>
    </article>
  );
}
