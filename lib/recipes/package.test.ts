import { describe, expect, it } from "vitest";
import { inspectRecipePackage } from "./package";
import { prepareRecipeCollection } from "./collection";

const markdownSections = [
  "A. Identity and ownership", "B. Capability register and callable objects", "C. Intent and applicability",
  "D. Inputs and outputs", "E. Constraints and budgets", "F. CRUD and side effects",
  "G. Autonomy and approval policy", "H. Execution plan", "I. Continuous verification",
  "J. Self-correction and recovery", "K. Independent challenge", "L. Human escalation",
  "M. Completion conditions", "N. Final output contract", "O. Learning and revision",
  "P. Testing and publication readiness", "Q. Open questions and known limitations",
];
const recipeMd = `# Research summary\n\n${markdownSections.map((heading) => `## ${heading}\n\nUNVERIFIED: supply recipe-specific detail and evidence.`).join("\n\n")}`;
const reportMd = `# Validation report\n\n${["Checks performed", "Results", "Findings", "Evidence", "Tests still needed", "Limitations"].map((heading) => `## ${heading}\n\nUNVERIFIED: no test evidence supplied.`).join("\n\n")}`;

const manifest = (content: string) => ({
  files: [{ path: "recipe.yaml", content }],
});

describe("structured recipe intake", () => {
  it("accepts a self-contained YAML recipe with inline input and output schemas", async () => {
    const result = await inspectRecipePackage(manifest([
      "id: research.summary",
      "version: 1.0.0",
      "description: Summarize a research document",
      "provides: [summary]",
      "requires: [document]",
      "dependencies: []",
      "preconditions: []",
      "side_effects: none",
      "permissions: []",
      "adapter: research.summarizer",
      "input_schema:",
      "  type: object",
      "  properties:",
      "    document: { type: string, minLength: 1 }",
      "  required: [document]",
      "  additionalProperties: false",
      "output_schema:",
      "  type: object",
      "  properties:",
      "    summary: { type: string }",
      "  required: [summary]",
      "  additionalProperties: false",
    ].join("\n")));
    expect(result.valid).toBe(true);
    expect(result.files).toHaveLength(1);
    expect(result.inputFields).toEqual([{ name: "document", required: true, type: "string", title: "document" }]);
  });

  it("does not treat a conceptual YAML block as an approved runtime schema", async () => {
    const result = await inspectRecipePackage({
      files: [{ path: "recipe.yaml", content: [
        "id: research.summary", "version: 1.0.0", "description: Summarize research",
        "provides: [summary]", "requires: [document]", "dependencies: []", "preconditions: []",
        "side_effects: none", "permissions: []", "adapter: UNVERIFIED",
        "input_schema: { type: object, properties: { document: { type: string } } }",
        "output_schema: { type: object, properties: { summary: { type: string } } }",
        "skillport_standard: { version: '1.0', invented_field: true }",
      ].join("\n") }],
    });
    expect(result.valid).toBe(true);
    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringMatching(/conceptual authoring example/i),
      expect.stringMatching(/does not by itself satisfy.*recipe\.md/i),
    ]));
  });

  it("applies structural package checks to a selected ZIP recipe and its referenced schemas", async () => {
    const recipe = [
      "id: research.summary", "version: 1.0.0", "description: Summarize research",
      "provides: [summary]", "requires: [document]", "dependencies: []", "preconditions: []",
      "side_effects: none", "permissions: []", "adapter: UNVERIFIED",
      "input_schema: schemas/input.schema.json", "output_schema: schemas/output.schema.json",
    ].join("\n");
    const prepared = await prepareRecipeCollection({ files: [
      { path: "research/recipe.yaml", content: recipe },
      { path: "research/recipe.md", content: recipeMd },
      { path: "research/validation-report.md", content: reportMd },
      { path: "research/schemas/input.schema.json", content: JSON.stringify({ type: "object", properties: { document: { type: "string" } }, required: ["document"] }) },
      { path: "research/schemas/output.schema.json", content: JSON.stringify({ type: "object", properties: { summary: { type: "string" } }, required: ["summary"] }) },
    ] });
    expect(prepared).toHaveLength(1);
    expect(prepared[0].report.valid).toBe(true);
    expect(prepared[0].envelope.files.map((file) => file.path)).toEqual(expect.arrayContaining([
      "research/recipe.yaml", "research/schemas/input.schema.json", "research/schemas/output.schema.json",
    ]));
  });

  it("blocks YAML-only and ZIP entries without the manager-required Markdown pair", async () => {
    const prepared = await prepareRecipeCollection({
      files: [{ path: "recipe.yaml", content: [
        "id: research.summary", "version: 1.0.0", "description: Summarize research",
        "provides: [summary]", "requires: [document]", "dependencies: []", "preconditions: []",
        "side_effects: none", "permissions: []", "adapter: UNVERIFIED",
        "input_schema: { type: object, properties: { document: { type: string } } }",
        "output_schema: { type: object, properties: { summary: { type: string } } }",
      ].join("\n") }],
    });
    expect(prepared[0].report.valid).toBe(false);
    expect(prepared[0].report.issues.map((issue) => issue.code)).toEqual(expect.arrayContaining([
      "manager_recipe_markdown_missing", "manager_validation_report_missing",
    ]));
  });

  it("does not require the conceptual skillport_standard YAML block", async () => {
    const content = [
      "id: research.summary", "version: 1.0.0", "description: Summarize research",
      "provides: [summary]", "requires: [document]", "dependencies: []", "preconditions: []",
      "side_effects: none", "permissions: []", "adapter: UNVERIFIED",
      "input_schema: { type: object, properties: { document: { type: string } } }",
      "output_schema: { type: object, properties: { summary: { type: string } } }",
    ].join("\n");
    const result = await inspectRecipePackage({ files: [{ path: "recipe.yaml", content }] });
    expect(result.valid).toBe(true);
    expect(result.issues.some((issue) => issue.code === "recipe_standard")).toBe(false);
  });

  it("rejects external references inside inline schemas", async () => {
    const result = await inspectRecipePackage(manifest([
      "id: research.summary",
      "version: 1.0.0",
      "description: Summarize a research document",
      "provides: [summary]",
      "requires: []",
      "dependencies: []",
      "preconditions: []",
      "side_effects: none",
      "permissions: []",
      "adapter: research.summarizer",
      "input_schema: { $ref: other.schema.json }",
      "output_schema: { type: object }",
    ].join("\n")));
    expect(result.valid).toBe(false);
    expect(result.issues.some((issue) => issue.code === "unsupported_schema")).toBe(true);
  });

  it("does not let a standalone manifest skip schemas that are external files", async () => {
    const result = await inspectRecipePackage(manifest([
      "id: research.summary",
      "version: 1.0.0",
      "description: Summarize a research document",
      "provides: [summary]",
      "requires: []",
      "dependencies: []",
      "preconditions: []",
      "side_effects: none",
      "permissions: []",
      "adapter: research.summarizer",
      "input_schema: schemas/input.schema.json",
      "output_schema: schemas/output.schema.json",
    ].join("\n")));
    expect(result.valid).toBe(false);
    expect(result.issues.filter((issue) => issue.code === "missing_schema")).toHaveLength(2);
  });

  it("rejects executable YAML tags", async () => {
    await expect(inspectRecipePackage(manifest("!!js/function 'return 1'"))).rejects.toThrow(
      /plain, non-duplicated YAML/,
    );
  });
  it("rejects recursive YAML aliases and bounded alias expansion", async () => {
    await expect(inspectRecipePackage(manifest("root: &root [*root]\n"))).rejects.toThrow(
      /plain, non-duplicated YAML/,
    );
    const expansion = ["a: &a [1, 1, 1, 1, 1]"];
    for (const [name, previous] of [["b", "a"], ["c", "b"], ["d", "c"], ["e", "d"], ["f", "e"], ["g", "f"]]) {
      expansion.push(`${name}: &${name} [*${previous}, *${previous}, *${previous}, *${previous}, *${previous}]`);
    }
    await expect(inspectRecipePackage(manifest(`${expansion.join("\n")}\n`))).rejects.toThrow(
      /plain, non-duplicated YAML/,
    );
  });
  it("rejects duplicate YAML keys", async () => {
    await expect(inspectRecipePackage(manifest("id: first\nid: second\n"))).rejects.toThrow(
      /plain, non-duplicated YAML/,
    );
  });
  it("rejects manifests larger than 32 KB", async () => {
    await expect(inspectRecipePackage(manifest("a".repeat(32 * 1024 + 1)))).rejects.toThrow(
      /smaller than 32 KB/,
    );
  });
  it("rejects traversal and case-colliding source paths", async () => {
    await expect(inspectRecipePackage({ files: [
      { path: "../recipe.yaml", content: "id: example" },
    ] })).rejects.toThrow(/relative/);
    await expect(inspectRecipePackage({ files: [
      { path: "recipe.yaml", content: "id: example" },
      { path: "RECIPE.yaml", content: "id: other" },
    ] })).rejects.toThrow(/Duplicate/);
  });
});
