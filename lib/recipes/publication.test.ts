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
