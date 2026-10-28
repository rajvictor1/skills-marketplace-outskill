export const MAX_RECIPE_MARKDOWN_BYTES = 256 * 1024;
export const MAX_VALIDATION_REPORT_BYTES = 128 * 1024;

/** Canonical section names from SKILLPORT_RECIPE_STANDARD-1.md, sections A–Q. */
const RECIPE_SECTIONS = [
  ["A", "identity and ownership", ["identity and ownership"]],
  ["B", "capability register and callable objects", ["capability register", "capability register and callable objects"]],
  ["C", "intent and applicability", ["intent and applicability"]],
  ["D", "inputs and outputs", ["inputs and outputs"]],
  ["E", "constraints and budgets", ["constraints and budgets"]],
  ["F", "CRUD and side effects", ["crud and side effects"]],
  ["G", "autonomy and approval policy", ["autonomy and approval", "autonomy and approval policy"]],
  ["H", "execution plan", ["execution plan"]],
  ["I", "continuous verification", ["continuous verification"]],
  ["J", "self-correction and recovery", ["self-correction and recovery"]],
  ["K", "independent challenge", ["independent challenge"]],
  ["L", "human escalation", ["human escalation"]],
  ["M", "completion conditions", ["completion conditions"]],
  ["N", "final output contract", ["final output contract"]],
  ["O", "learning and revision", ["learning and revision"]],
  ["P", "testing and publication readiness", ["testing and publication readiness"]],
  ["Q", "open questions and known limitations", ["open questions and limitations", "open questions and known limitations"]],
] as const;

const REPORT_SECTIONS = [
  "checks performed",
  "results",
  "findings",
  "evidence",
  "tests still needed",
  "limitations",
] as const;

export type MarkdownRecipeIssue = { file: string; message: string };

type Heading = { level: number; title: string; index: number };

function headings(content: string): Heading[] {
  return [...content.matchAll(/^(#{1,6})\s+(.+?)\s*#*\s*$/gm)].map((match) => ({
    level: match[1].length,
    title: match[2].trim(),
    index: match.index ?? 0,
  }));
}

function normalizeHeading(value: string): string {
  return value
    .replace(/^\s*(?:[A-Q]|\d+)[.)\s:-]+/i, "")
    .replace(/[`*_]/g, "")
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/gi, " ")
    .trim()
    .toLowerCase();
}

function matchesSection(title: string, aliases: readonly string[]): boolean {
  const normalized = normalizeHeading(title);
  return aliases.some((alias) => {
    const candidate = normalizeHeading(alias);
    return normalized === candidate || normalized.startsWith(`${candidate} `);
  });
}

function sectionBody(content: string, heading: Heading, all: Heading[]): string {
  const next = all.find((candidate) => candidate.index > heading.index && candidate.level <= heading.level);
  return content.slice(heading.index + heading.title.length + heading.level + 2, next?.index ?? content.length);
}

function withoutHtmlComments(value: string): string {
  let result = "";
  let cursor = 0;
  while (cursor < value.length) {
    const opening = value.indexOf("<!--", cursor);
    if (opening === -1) return result + value.slice(cursor);
    result += value.slice(cursor, opening);
    const closing = value.indexOf("-->", opening + 4);
    if (closing === -1) return result;
    cursor = closing + 3;
  }
  return result;
}

function hasSubstantiveContent(content: string, heading: Heading, all: Heading[]): boolean {
  const body = withoutHtmlComments(sectionBody(content, heading, all))
    .split("\n")
    .map((line) => line.replace(/\[[^\]]*\]/g, "").trim())
    .filter((line) => line && !/^[-|:\s]+$/.test(line) && !/^\|.*\|$/.test(line))
    .filter((line) => !/^[-*+]\s+(?:\*\*[^*]+\*\*|[^:]+):\s*$/.test(line))
    .join(" ")
    .replace(/\[[^\]]*\]/g, "")
    .trim();
  return body.length > 0;
}

function validateSections(
  content: string,
  file: string,
  sections: readonly { name: string; aliases: readonly string[] }[],
): MarkdownRecipeIssue[] {
  const parsed = headings(content);
  const issues: MarkdownRecipeIssue[] = [];
  for (const section of sections) {
    const found = parsed.find((heading) => matchesSection(heading.title, section.aliases));
    if (!found) {
      issues.push({ file, message: `Add the “${section.name}” section from the manager's recipe standard.` });
    } else if (!hasSubstantiveContent(content, found, parsed)) {
      issues.push({ file, message: `Add recipe-specific content or an explicit explanation in “${section.name}”.` });
    }
  }
  return issues;
}

export function validateMarkdownRecipePair(recipe: string, report: string): MarkdownRecipeIssue[] {
  const issues: MarkdownRecipeIssue[] = [];
  if (!recipe.trim()) issues.push({ file: "recipe.md", message: "The recipe Markdown file is empty." });
  if (!/^#\s+\S/m.test(recipe)) issues.push({ file: "recipe.md", message: "Start the recipe with a level-one title, for example `# Hotel booking assistant`." });
  issues.push(...validateSections(
    recipe,
    "recipe.md",
    RECIPE_SECTIONS.map(([letter, name, aliases]) => ({ name: `${letter}. ${name}`, aliases: [name, ...aliases] })),
  ));

  if (!report.trim()) issues.push({ file: "validation-report.md", message: "The separate validation report is empty." });
  issues.push(...validateSections(
    report,
    "validation-report.md",
    REPORT_SECTIONS.map((name) => ({ name, aliases: [name] })),
  ));
  return issues;
}
