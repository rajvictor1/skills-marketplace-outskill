import type { Severity, TrustTier } from "@/lib/trust";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";

export type SampleFinding = {
  id: string;
  layer:
    | "hidden_text"
    | "dangerous_pattern"
    | "script_analysis"
    | "llm_injection";
  severity: Severity;
  category: string;
  title: string;
  description: string;
  filePath: string | null;
  evidence?: string;
  confidence?: number;
};

export type SampleSkill = {
  id: string;
  slug: string;
  name: string;
  description: string;
  summary: string;
  category: string;
  subcategory?: string;
  tags?: string[];
  metadata?: SkillMarketplaceMetadata;
  version: string;
  trustTier: TrustTier;
  riskScore: number;
  status: "published" | "blocked";
  installs: number;
  ratingAverage?: number;
  ratingCount?: number;
  adminApproved?: boolean;
  updatedAt: string;
  author: {
    name: string;
    handle: string;
    role: string;
    initials: string;
  };
  files: { path: string; sizeLabel: string; isScript: boolean }[];
  skillMd: string;
  findings: SampleFinding[];
  scannerVersion: string;
  classifierModel: string;
};

export type SkillMarketplaceMetadata = {
  format?: "recipe_package";
  recipeId?: string;
  packageVersionId?: string;
  packageHash?: string;
  manifestPath?: string;
  runtimeVerified?: false;
  isSample?: boolean;
  license?: string;
  compatibility?: string[];
  requestedPermissions?: string[];
  inputs?: string;
  outputs?: string;
  dataHandling?: string;
  documentationUrl?: string;
  supportUrl?: string;
  githubUrl?: string;
};

export const CATEGORIES = ["All", ...SKILL_CATEGORY_NAMES] as const;

export const SAMPLE_SKILLS: SampleSkill[] = [];
export function getSkillBySlug(slug: string) {
  return SAMPLE_SKILLS.find((s) => s.slug === slug);
}
