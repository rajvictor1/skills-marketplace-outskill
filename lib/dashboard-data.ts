export const DASHBOARD_PULSE = [
  { label: "Example active creators", value: "642", detail: "Illustrative scenario, not live accounts" },
  { label: "Example time saved", value: "9,680 hrs", detail: "Illustrative estimate" },
  { label: "Example creator earnings", value: "$84,560", detail: "Payouts are not connected" },
] as const;

export const SAMPLE_ACTIVITY = [
  { title: "SEO Content Brief Builder completed a run", detail: "Marketing · 18 sec · success", time: "4 min ago", type: "success" },
  { title: "New skill version passed security review", detail: "Month-End Close Assistant · v2.1.0", time: "26 min ago", type: "scan" },
  { title: "Run needs human review", detail: "Customer Email Drafter · approval requested", time: "52 min ago", type: "review" },
  { title: "Cohort Retention Analyst installed", detail: "Product analytics · by Dana O.", time: "1 hr ago", type: "install" },
] as const;

export type ChartMetric = "runs" | "success" | "cost" | "latency";
export type RangeKey = "7d" | "30d" | "90d";

export type TrendPoint = {
  date: string;
  runs: number;
  successful: number;
  review: number;
  failed: number;
  cost: number;
  latency: number;
};

/** Deterministic sample trend. Replace with aggregated run records when instrumented. */
export function getIllustrativeTrend(days = 90): TrendPoint[] {
  const today = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(date.getUTCDate() - (days - index - 1));
    const wave = Math.sin(index * 0.37) * 18 + Math.cos(index * 0.13) * 12;
    const runs = Math.max(260, Math.round(540 + index * 1.55 + wave));
    const successRate = 0.958 + Math.sin(index * 0.19) * 0.009;
    const successful = Math.round(runs * successRate);
    const review = Math.round(runs * (0.023 + Math.cos(index * 0.21) * 0.003));
    return {
      date: date.toISOString().slice(0, 10),
      runs,
      successful,
      review,
      failed: Math.max(0, runs - successful - review),
      cost: Math.round((runs * (0.018 + Math.sin(index * 0.17) * 0.002)) * 100) / 100,
      latency: Math.round(5.4 + Math.cos(index * 0.16) * 0.7 + Math.sin(index * 0.42) * 0.25),
    };
  });
}

export const SAMPLE_RUNS = [
  { id: "run-8472", skill: "SEO Content Brief Builder", category: "Marketing", agent: "Content Planner", status: "success", duration: "18 sec", cost: "$0.042", started: "Today, 10:42 AM", approval: "Not required" },
  { id: "run-8471", skill: "Customer Email Drafter", category: "Customer Support", agent: "Support Triage", status: "review", duration: "31 sec", cost: "$0.061", started: "Today, 10:38 AM", approval: "Waiting for review" },
  { id: "run-8470", skill: "Cohort Retention Analyst", category: "Data & Analytics", agent: "Growth Analyst", status: "success", duration: "2 min 14 sec", cost: "$0.184", started: "Today, 10:31 AM", approval: "Not required" },
  { id: "run-8469", skill: "Month-End Close Assistant", category: "Finance & Accounting", agent: "Finance Copilot", status: "failed", duration: "46 sec", cost: "$0.073", started: "Today, 10:19 AM", approval: "Not requested" },
  { id: "run-8468", skill: "SEO Content Brief Builder", category: "Marketing", agent: "Content Planner", status: "success", duration: "21 sec", cost: "$0.044", started: "Today, 10:12 AM", approval: "Not required" },
  { id: "run-8467", skill: "Contract Intake Reviewer", category: "Legal & Compliance", agent: "Legal Ops", status: "success", duration: "1 min 6 sec", cost: "$0.098", started: "Today, 9:58 AM", approval: "Approved by A. Lee" },
] as const;
