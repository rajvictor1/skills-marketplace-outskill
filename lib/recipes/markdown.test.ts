import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { validateMarkdownRecipePair } from "./markdown";

const headings = [
  "A. Identity and ownership",
  "B. Capability register and callable objects",
  "C. Intent and applicability",
  "D. Inputs and outputs",
  "E. Constraints and budgets",
  "F. CRUD and side effects",
  "G. Autonomy and approval policy",
  "H. Execution plan",
  "I. Continuous verification",
  "J. Self-correction and recovery",
  "K. Independent challenge",
  "L. Human escalation",
  "M. Completion conditions",
  "N. Final output contract",
  "O. Learning and revision",
  "P. Testing and publication readiness",
  "Q. Open questions and known limitations",
];
const recipe = `# Hotel booking assistant\n\n${headings.map((heading) => `## ${heading}\n\nNot applicable for this example because it only drafts a search plan.`).join("\n\n")}`;
const report = `# Validation report\n\n${[
  "Checks performed", "Results", "Findings", "Evidence", "Tests still needed", "Limitations",
].map((heading) => `## ${heading}\n\nNo external execution evidence supplied; this is a static document review.`).join("\n\n")}`;

describe("validateMarkdownRecipePair against Skill Port Recipe Standard v1", () => {
  it("accepts the manager's canonical A–Q headings and separate report sections", () => {
    expect(validateMarkdownRecipePair(recipe, report)).toEqual([]);
  });

  it("accepts the older short section labels as aliases for the canonical standard", () => {
    const legacyHeadings = headings.map((heading) => heading
      .replace(/^([A-Q])\. /, "")
      .replace("Capability register and callable objects", "Capability register")
      .replace("Autonomy and approval policy", "Autonomy and approval")
      .replace("Open questions and known limitations", "Open questions and limitations"));
    const legacyRecipe = `# Example\n\n${legacyHeadings.map((heading) => `## ${heading}\n\nNot applicable, with reason.`).join("\n\n")}`;
    expect(validateMarkdownRecipePair(legacyRecipe, report)).toEqual([]);
  });

  it("reports missing canonical sections and report findings by file", () => {
    const issues = validateMarkdownRecipePair("# A short recipe\n\n## A. Identity and ownership\n\nName: example", "# Report\n\n## Results\n\nNo checks ran.");
    expect(issues.some((issue) => issue.file === "recipe.md" && issue.message.includes("B. capability register and callable objects"))).toBe(true);
    expect(issues.some((issue) => issue.file === "validation-report.md" && issue.message.includes("findings"))).toBe(true);
    expect(issues.some((issue) => issue.file === "validation-report.md" && issue.message.includes("tests still needed"))).toBe(true);
  });

  it("does not accept an empty section body", () => {
    const emptyRecipe = recipe.replace("## D. Inputs and outputs\n\nNot applicable for this example because it only drafts a search plan.", "## D. Inputs and outputs\n\n");
    expect(validateMarkdownRecipePair(emptyRecipe, report)).toContainEqual({
      file: "recipe.md",
      message: "Add recipe-specific content or an explicit explanation in “D. inputs and outputs”.",
    });
  });

  it("requires a separate, non-empty validation report", () => {
    expect(validateMarkdownRecipePair(recipe, "").some((issue) => issue.file === "validation-report.md")).toBe(true);
  });

  it("does not allow the untouched downloadable outlines to pass as completed documents", () => {
    const recipeTemplate = readFileSync(resolve(process.cwd(), "public/templates/recipe-markdown-standard.md"), "utf8");
    const reportTemplate = readFileSync(resolve(process.cwd(), "public/templates/recipe-validation-report.md"), "utf8");
    const issues = validateMarkdownRecipePair(recipeTemplate, reportTemplate);
    expect(issues.some((issue) => issue.file === "recipe.md" && issue.message.includes("recipe-specific content"))).toBe(true);
    expect(issues.some((issue) => issue.file === "validation-report.md" && issue.message.includes("checks performed"))).toBe(true);
  });
});
