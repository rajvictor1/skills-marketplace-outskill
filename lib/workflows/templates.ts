import type { SkillCategory } from "@/lib/skills/taxonomy";

export type WorkflowTemplate = {
  slug: string;
  title: string;
  summary: string;
  category: SkillCategory;
  subcategory: string;
  author: string;
  sourceUrl: string;
  downloadUrl: string;
  integrations: readonly string[];
  nodeCount: number;
  setup: readonly string[];
};

/** Curated n8n workflow files supplied for this marketplace. These are not SKILL.md submissions. */
export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    slug: "youtube-transcript-summary",
    title: "Summarize YouTube videos from transcript",
    summary: "Collect a YouTube transcript through Apify, then summarize it with an OpenAI model in n8n.",
    category: "Marketing",
    subcategory: "Content",
    author: "Ahmed Alnaqa",
    sourceUrl: "https://n8n.io/workflows/2736-summarize-youtube-videos-from-transcript/",
    downloadUrl: "/workflows/youtube-transcript-summary.json",
    integrations: ["n8n", "Apify", "OpenAI"],
    nodeCount: 10,
    setup: [
      "Choose a YouTube transcript Actor and replace the Apify URL placeholder in n8n.",
      "Connect your own OpenAI credential inside n8n.",
      "Review the form trigger and run a test video before activating the workflow.",
    ],
  },
];
