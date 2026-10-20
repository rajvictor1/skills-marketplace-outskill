/** Curated marketplace taxonomy. Categories stay controlled so filters and
 * reporting remain consistent; creators choose one category and one subcategory. */
export const CATEGORY_GROUPS = [
  {
    name: "Business",
    categories: [
      { name: "Marketing", subcategories: ["SEO & GEO", "Demand generation", "Content", "Campaigns", "Social & email"] },
      { name: "Sales", subcategories: ["Sales operations", "Prospecting", "Account research", "CRM"] },
      { name: "Customer Support", subcategories: ["Support operations", "Knowledge base", "Customer success"] },
      { name: "Operations", subcategories: ["Process automation", "Project management", "Procurement"] },
      { name: "Finance & Accounting", subcategories: ["Accounting", "Financial analysis", "Billing"] },
      { name: "Legal & Compliance", subcategories: ["Contract review", "Policy", "Compliance"] },
      { name: "Human Resources", subcategories: ["Recruiting", "People operations", "Learning"] },
    ],
  },
  {
    name: "Technology & Data",
    categories: [
      { name: "Technology", subcategories: ["Automation & workflows", "Software integrations", "API workflows", "Developer tools"] },
      { name: "Software Development", subcategories: ["Frontend", "Backend", "Code review", "Testing"] },
      { name: "Data & Analytics", subcategories: ["Business intelligence", "Data engineering", "Product analytics"] },
      { name: "AI & Machine Learning", subcategories: ["AI workflows", "Model operations", "Prompt design"] },
      { name: "IT & Security", subcategories: ["IT operations", "Security review", "Identity & access"] },
      { name: "DevOps & Cloud", subcategories: ["Infrastructure", "CI/CD", "Cloud operations"] },
    ],
  },
  {
    name: "Knowledge & Productivity",
    categories: [
      { name: "Research", subcategories: ["Market research", "Competitive research", "Academic research"] },
      { name: "Writing & Communication", subcategories: ["Business writing", "Editing", "Documentation"] },
      { name: "Productivity", subcategories: ["Personal workflows", "Meeting support", "Planning"] },
      { name: "Education", subcategories: ["Tutoring", "Course design", "Assessment"] },
      { name: "Other", subcategories: ["General"] },
    ],
  },
] as const;

export type SkillCategory = (typeof CATEGORY_GROUPS)[number]["categories"][number]["name"];

export const SKILL_CATEGORY_NAMES = CATEGORY_GROUPS.flatMap((group) =>
  group.categories.map((category) => category.name),
);

export function isSkillCategory(value: string): value is SkillCategory {
  return SKILL_CATEGORY_NAMES.includes(value as SkillCategory);
}

export function getSubcategories(categoryName: string): readonly string[] {
  for (const group of CATEGORY_GROUPS) {
    const category = group.categories.find((item) => item.name === categoryName);
    if (category) return category.subcategories;
  }
  return [];
}
