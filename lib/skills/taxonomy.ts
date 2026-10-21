/** Curated marketplace taxonomy. Categories stay controlled so filters and
 * reporting remain consistent; creators choose one category and one subcategory. */
export const CATEGORY_GROUPS = [
  {
    name: "Business",
    categories: [
      {
        name: "Marketing",
        subcategories: [
          "SEO & GEO",
          "Demand generation",
          "Content",
          "Campaigns",
          "Social & email",
        ],
      },
      {
        name: "Sales",
        subcategories: [
          "Sales operations",
          "Prospecting",
          "Account research",
          "CRM",
        ],
      },
      {
        name: "Customer Support",
        subcategories: [
          "Support operations",
          "Knowledge base",
          "Customer success",
        ],
      },
      {
        name: "Operations",
        subcategories: [
          "Process automation",
          "Project management",
          "Procurement",
        ],
      },
      {
        name: "Finance & Accounting",
        subcategories: ["Accounting", "Financial analysis", "Billing"],
      },
      {
        name: "Legal & Compliance",
        subcategories: ["Contract review", "Policy", "Compliance"],
      },
      {
        name: "Human Resources",
        subcategories: ["Recruiting", "People operations", "Learning"],
      },
      {
        name: "Healthcare",
        subcategories: [
          "Appointments & intake",
          "Clinical support",
          "Billing & insurance",
          "Personal health",
        ],
      },
    ],
  },
  {
    name: "Technology & Data",
    categories: [
      {
        name: "Technology",
        subcategories: [
          "Automation & workflows",
          "Software integrations",
          "API workflows",
          "Developer tools",
        ],
      },
      {
        name: "Software Development",
        subcategories: ["Frontend", "Backend", "Code review", "Testing"],
      },
      {
        name: "Data & Analytics",
        subcategories: [
          "Business intelligence",
          "Data engineering",
          "Product analytics",
        ],
      },
      {
        name: "AI & Machine Learning",
        subcategories: ["AI workflows", "Model operations", "Prompt design"],
      },
      {
        name: "IT & Security",
        subcategories: [
          "IT operations",
          "Security review",
          "Identity & access",
        ],
      },
      {
        name: "DevOps & Cloud",
        subcategories: ["Infrastructure", "CI/CD", "Cloud operations"],
      },
    ],
  },
  {
    name: "Knowledge & Productivity",
    categories: [
      {
        name: "Research",
        subcategories: [
          "Market research",
          "Competitive research",
          "Academic research",
        ],
      },
      {
        name: "Writing & Communication",
        subcategories: ["Business writing", "Editing", "Documentation"],
      },
      {
        name: "Productivity",
        subcategories: ["Personal workflows", "Meeting support", "Planning"],
      },
      {
        name: "Education",
        subcategories: ["Tutoring", "Course design", "Assessment"],
      },
      {
        name: "Entertainment",
        subcategories: [
          "Creative writing",
          "Games & interactive",
          "Video & audio",
          "Hobbies & culture",
        ],
      },
      { name: "Other", subcategories: ["General"] },
    ],
  },
] as const;

export type SkillCategory =
  (typeof CATEGORY_GROUPS)[number]["categories"][number]["name"];

export const SKILL_CATEGORY_NAMES = CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => category.name),
);

export const CATEGORY_DESCRIPTIONS: Record<SkillCategory, string> = {
  Marketing: "Recipes for campaigns, content, SEO, GEO, and audience growth.",
  Sales: "Find prospects, research accounts, and improve sales workflows.",
  "Customer Support":
    "Help teams answer questions and support customers consistently.",
  Operations: "Make repeatable business processes easier to run and manage.",
  "Finance & Accounting":
    "Support financial analysis, billing, and accounting work.",
  "Legal & Compliance":
    "Organize contract, policy, and compliance review tasks.",
  "Human Resources": "Help with recruiting, learning, and people operations.",
  Healthcare:
    "Explore appointment, intake, billing, and personal health workflows with human oversight.",
  Technology: "Connect software, APIs, and everyday technical workflows.",
  "Software Development":
    "Assist with building, reviewing, and maintaining software.",
  "Data & Analytics": "Turn data into useful reports, analysis, and decisions.",
  "AI & Machine Learning":
    "Build and manage AI workflows, prompts, and model operations.",
  "IT & Security": "Support IT operations, access, and security review.",
  "DevOps & Cloud":
    "Help with infrastructure, delivery pipelines, and cloud work.",
  Research: "Explore markets, competitors, and complex questions.",
  "Writing & Communication": "Draft, edit, and document ideas more clearly.",
  Productivity: "Plan work, prepare meetings, and manage personal workflows.",
  Education: "Create learning materials, tutoring support, and assessments.",
  Entertainment:
    "Create stories, explore games, and build playful media experiences.",
  Other: "Explore useful recipes that do not fit a specialist field yet.",
};

export function categorySlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getCategoryBySlug(slug: string) {
  for (const group of CATEGORY_GROUPS) {
    const category = group.categories.find(
      (item) => categorySlug(item.name) === slug,
    );
    if (category) return { group, category };
  }
  return null;
}

export function isSkillCategory(value: string): value is SkillCategory {
  return SKILL_CATEGORY_NAMES.includes(value as SkillCategory);
}

export function getSubcategories(categoryName: string): readonly string[] {
  for (const group of CATEGORY_GROUPS) {
    const category = group.categories.find(
      (item) => item.name === categoryName,
    );
    if (category) return category.subcategories;
  }
  return [];
}
