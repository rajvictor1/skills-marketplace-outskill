import type { SkillCategory } from "@/lib/skills/taxonomy";

export type WorkflowTemplate = {
  slug: string;
  title: string;
  summary: string;
  category: SkillCategory;
  subcategory: string;
  author: string;
  downloadUrl: string;
  integrations: readonly string[];
  nodeCount: number;
  setup: readonly string[];
};

/** Curated n8n workflow files supplied for this marketplace. These are not SKILL.md submissions. */
export const WORKFLOW_TEMPLATES: readonly WorkflowTemplate[] = [
  {
    slug: "youtube-transcript-summary",
    title: "YouTube Transcript Summarizer",
    summary: "Turn a video URL into a concise transcript summary for content research and repurposing.",
    category: "Marketing",
    subcategory: "Content",
    author: "Ahmed Alnaqa",
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
