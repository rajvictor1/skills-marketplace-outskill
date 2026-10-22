import { describe, expect, it } from "vitest";
import { inspectRecipePackage } from "./package";

const manifest = (content: string) => ({
  files: [{ path: "recipe.yaml", content }],
});

describe("structured recipe intake", () => {
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
