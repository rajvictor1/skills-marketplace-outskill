import { beforeEach, describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  source: vi.fn(),
  inspect: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/admin", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("@/lib/recipes/storage", () => ({
  getPrivateRecipeVersion: mocks.source,
}));
vi.mock("@/lib/recipes/package", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  inspectRecipePackage: mocks.inspect,
}));
import { prepareRecipePublication } from "./publication";
import { getSubcategories } from "@/lib/skills/taxonomy";
const details = {
  name: "Research question",
  summary: "Turn a research request into a focused question.",
  category: "Research",
  subcategory: getSubcategories("Research")[0],
  license: "MIT",
  rights: "on",
};
describe("recipe publication access and integrity gates", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mocks.admin.mockResolvedValue({ id: "admin" });
  });
  it("denies non-admin callers before reading private files", async () => {
    mocks.admin.mockRejectedValue(new Error("Administrator access required."));
    await expect(prepareRecipePublication("id", details)).rejects.toThrow(
      "Administrator",
    );
    expect(mocks.source).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires redistribution confirmation before creating a public submission", async () => {
    await expect(
      prepareRecipePublication("id", { ...details, rights: undefined }),
    ).rejects.toThrow("redistribution");
    expect(mocks.source).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects a category/subcategory mismatch", async () => {
    await expect(
      prepareRecipePublication("id", { ...details, subcategory: "invalid" }),
    ).rejects.toThrow("subcategory");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it.each(["draft", "pending_review", "rejected"])(
    "does not transfer a %s package",
    async (status) => {
      mocks.source.mockResolvedValue({ status });
      await expect(prepareRecipePublication("id", details)).rejects.toThrow(
        "Approve this private",
      );
      expect(mocks.inspect).not.toHaveBeenCalled();
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );
  it.each([
    { valid: false, packageHash: "saved" },
    { valid: true, packageHash: "changed" },
  ])("does not transfer invalid or changed files", async (report) => {
    mocks.source.mockResolvedValue({
      status: "approved",
      payload: { files: [] },
      package_hash: "saved",
    });
    mocks.inspect.mockResolvedValue(report);
    await expect(prepareRecipePublication("id", details)).rejects.toThrow(
      "integrity",
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

it("stages original files for review without publishing or asserting runtime readiness", async () => {
  vi.resetAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  const payload = {
    manifestPath: "recipe.yaml",
    files: [{ path: "recipe.yaml", content: "id: research.question.frame" }],
  };
  mocks.source.mockResolvedValue({
    id: "private-version",
    status: "approved",
    recipe_id: "research.question.frame",
    version: "1.0.0",
    manifest_path: "recipe.yaml",
    package_hash: "hash",
    payload,
  });
  mocks.inspect.mockResolvedValue({
    valid: true,
    packageHash: "hash",
    inputFields: [],
    permissions: ["research.analyze"],
    dependencies: [],
    runtimeBlockers: ["Adapter unimplemented"],
    riskScore: 0,
    security: { scannerVersion: "current", layers: {}, findings: [] },
  });
  const writes: { table: unknown; value: unknown }[] = [];
  const select = {
    from: () => select,
    where: () => select,
    for: () => select,
    limit: async () => [],
  };
  mocks.transaction.mockImplementation(async (fn) =>
    fn({
      execute: vi.fn(),
      select: () => select,
      insert: (table: unknown) => ({
        values: async (value: unknown) => {
          writes.push({ table, value });
        },
      }),
    }),
  );
  const schema = await import("@/lib/db/schema");
  await prepareRecipePublication("private-version", details);
  expect(writes.find((w) => w.table === schema.skill)?.value).toMatchObject({
    status: "draft",
    latestTrustTier: "caution",
  });
  expect(
    writes.find((w) => w.table === schema.skillSubmission)?.value,
  ).toMatchObject({
    status: "pending",
    snapshot: {
      metadata: {
        format: "recipe_package",
        runtimeVerified: false,
        requestedPermissions: ["research.analyze"],
      },
    },
  });
  const files = writes.find((w) => w.table === schema.skillFile)?.value as {
    path: string;
    content: string;
  }[];
  expect(
    JSON.parse(files.find((f) => f.path === "recipe-package.json")!.content),
  ).toEqual(payload);
  expect(files.some((f) => f.path === "SKILL.md")).toBe(false);
});
