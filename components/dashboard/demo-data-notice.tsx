import { Info } from "lucide-react";

export function DemoDataNotice({ children = "Catalog counts come from preview examples. Run trends, activity, creator payouts, and time saved are illustrative; live measurement is not connected yet." }: { children?: string }) {
  return <div className="flex gap-3 rounded-xl border border-primary/20 bg-primary/[0.06] px-4 py-3 text-sm leading-relaxed text-muted-foreground"><Info className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden /><p><span className="font-medium text-foreground">Demo data.</span> {children}</p></div>;
}
