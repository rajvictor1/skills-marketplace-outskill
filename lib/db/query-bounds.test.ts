import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

const root = process.cwd();

function filesBelow(directory: string): string[] {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    return statSync(path).isDirectory()
      ? filesBelow(path)
      : path.endsWith("page.tsx")
        ? [path]
        : [];
  });
}

function queryChains(sourcePath: string) {
  const sourceText = readFileSync(sourcePath, "utf8");
  const source = ts.createSourceFile(sourcePath, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const chains: { names: string[]; selection: string }[] = [];
  const visit = (node: ts.Node) => {
    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression) &&
      node.expression.name.text === "select" &&
      node.expression.expression.getText(source) === "db"
    ) {
      const names: string[] = ["select"];
      let current: ts.Node = node;
      while (
        current.parent &&
        ts.isPropertyAccessExpression(current.parent) &&
        current.parent.expression === current &&
        current.parent.parent &&
        ts.isCallExpression(current.parent.parent) &&
        current.parent.parent.expression === current.parent
      ) {
        names.push(current.parent.name.text);
        current = current.parent.parent;
      }
      chains.push({ names, selection: node.arguments[0]?.getText(source) ?? "" });
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return chains;
}

function isAggregate(query: { names: string[]; selection: string }) {
  return query.names.includes("groupBy") || /\b(count|avg|sum|countDistinct)\s*\(/.test(query.selection);
}

describe("bounded database reads", () => {
  it("keeps every row-returning database query in page routes and catalog loaders bounded", () => {
    const inspected = [
      ...filesBelow(join(root, "app")),
      join(root, "lib/skills/catalog.ts"),
      join(root, "lib/db/marketplace-counters.ts"),
    ];
    const missingLimits = inspected.flatMap((path) =>
      queryChains(path)
        .filter((query) => !isAggregate(query) && !query.names.includes("limit"))
        .map((query) => `${relative(root, path)}: ${query.names.join(" → ")}`),
    );
    expect(missingLimits).toEqual([]);
  });

  it("bounds the catalog base rows and all per-page related rows", () => {
    const source = readFileSync(join(root, "lib/skills/catalog.ts"), "utf8");
    expect(source).toContain(".limit(normalized.pageSize + 1)");
    expect(source).toContain(".limit(versionIds.length * MAX_FILES_PER_VERSION)");
    expect(source).toContain(".limit(scanIds.length * MAX_FINDINGS_PER_VERSION)");
    expect(source).toContain(".limit(rows.length)");
  });

  it("uses page-bounded reads for the private recipe workbench", () => {
    const source = readFileSync(join(root, "lib/recipes/storage.ts"), "utf8");
    expect(source).toContain("limit ${pageSize + 1} offset ${offset}");
    expect(readFileSync(join(root, "app/admin/recipes/page.tsx"), "utf8")).toContain("listPrivateRecipeVersions(page)");
  });
});
