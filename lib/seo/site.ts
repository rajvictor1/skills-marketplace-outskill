import type { Metadata } from "next";

// Indexing is a launch decision. A Preview must never become the public canonical site.
const production = process.env.VERCEL_ENV === "production";
const configured = process.env.NEXT_PUBLIC_SITE_URL;
function safeOrigin(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.origin
      : undefined;
  } catch {
    return undefined;
  }
}
export const SITE_ORIGIN =
  (production ? safeOrigin(configured) : undefined) ??
  safeOrigin(
    `https://${process.env.VERCEL_BRANCH_URL ?? process.env.VERCEL_URL ?? ""}`,
  ) ??
  "http://localhost:3000";
export const INDEXING_ENABLED =
  production &&
  Boolean(safeOrigin(configured)) &&
  process.env.SEO_INDEXING_ENABLED === "true";
export const CONTENT_UPDATED = "2026-10-21";
export const REPOSITORY =
  "https://github.com/rajvictor1/skills-marketplace-outskill";
export function absoluteUrl(path: string) {
  return new URL(path, SITE_ORIGIN).toString();
}
export const privateRobots: Metadata["robots"] = {
  index: false,
  follow: false,
};
export function pageMetadata(
  path: string,
  title: string,
  description: string,
  indexable = true,
): Metadata {
  description = description.replace(/\s+/g, " ").trim();
  if (description.length > 160)
    description = description.slice(0, 157).replace(/\s+\S*$/, "") + "…";
  const fullTitle = title.includes("Skillbuffet")
    ? title
    : `${title} | Skillbuffet`;
  const image = absoluteUrl(`/og?path=${encodeURIComponent(path)}`);
  return {
    title: { absolute: fullTitle },
    description,
    alternates: { canonical: absoluteUrl(path) },
    robots:
      INDEXING_ENABLED && indexable
        ? {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          }
        : { index: false, follow: true },
    openGraph: {
      type: "website",
      siteName: "Skillbuffet",
      locale: "en_US",
      url: absoluteUrl(path),
      title: fullTitle,
      description,
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [image],
    },
  };
}
export const PUBLIC_PAGES: Record<
  string,
  { title: string; description: string }
> = {
  "/": {
    title: "Skillbuffet: Discover and Share Reviewed AI Agent Recipes",
    description:
      "Explore AI agent recipes by category, inspect instructions and review results, and download approved versions. Share your own SKILL.md for review.",
  },
  "/skills": {
    title: "AI Agent Recipes by Category and Use Case",
    description:
      "Browse AI agent recipes for marketing, development, research and more. Compare compatibility, declared permissions and review results before downloading.",
  },
  "/categories": {
    title: "AI Agent Recipe Categories and Specialties",
    description:
      "Explore Skillbuffet categories and specialties for marketing, software, research and everyday work. Find the right field for browsing or submitting a recipe.",
  },
  "/about": {
    title: "About Skillbuffet and Its AI Agent Recipe Review Process",
    description:
      "Learn what Skillbuffet does, who operates the beta, and how AI agent recipes reach the public catalog through scanning and administrator review.",
  },
  "/how-it-works": {
    title: "How to Find and Use Reviewed AI Agent Recipes",
    description:
      "Follow the Skillbuffet workflow: browse a category, inspect instructions and permissions, download an approved SKILL.md, and use it in your own agent.",
  },
  "/docs": {
    title: "AI Recipe Documentation and Publishing Guides",
    description:
      "Read Skillbuffet documentation for discovering, submitting and downloading AI agent recipes. Find review standards, API endpoints and release notes.",
  },
  "/security": {
    title: "AI Recipe Scanning and Administrator Review",
    description:
      "Understand Skillbuffet scanning for hidden text, dangerous instructions and script patterns. Learn what review checks cover and where their limits remain.",
  },
  "/reviews": {
    title: "Skillbuffet Community Reviews and Marketplace Feedback",
    description:
      "Read real community feedback about Skillbuffet and share your experience. Marketplace ratings are separate from GitHub stars and recipe security reviews.",
  },
  "/privacy": {
    title: "Skillbuffet Privacy Policy and Beta Data Practices",
    description:
      "Read how Skillbuffet handles accounts, submitted recipes, download records and reviews. Understand public listing information and current beta privacy limits.",
  },
  "/terms": {
    title: "Skillbuffet Terms of Use and Recipe Publishing Rules",
    description:
      "Review Skillbuffet beta terms for recipe submissions, content rights, acceptable use and reviews. Understand your responsibilities before publishing or downloading.",
  },
  "/publish": {
    title: "Submit AI Agent Recipes for Administrator Review",
    description:
      "Upload or paste SKILL.md, choose a category and declare permissions. GitHub is optional for file uploads; every new recipe version needs administrator approval.",
  },
};
export function staticMetadata(path: string, indexable = true) {
  const p = PUBLIC_PAGES[path];
  return pageMetadata(path, p.title, p.description, indexable);
}
