import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  limit: vi.fn(),
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/db/connection", () => ({
  hasDatabaseConnection: () => true,
  getDatabaseUrl: () => { throw new Error("A database connection was attempted in a unit test."); },
}));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("@/lib/recipes/access", () => ({ consumeRecipeInspectionLimit: mocks.limit }));
vi.mock("next/headers", () => ({ headers: async () => new Headers() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

import { inspectRecipeYaml, inspectRecipeZip, submitRecipeYaml, submitRecipeZip } from "@/app/actions/recipe-zip";
import { inspectRecipeMarkdown, submitRecipeMarkdown } from "@/app/actions/recipe-markdown";
import { reviewPrivateRecipeVersion, savePrivateRecipeVersion } from "@/lib/recipes/storage";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "creator" } });
  mocks.limit.mockResolvedValue(true);
});

describe("recipe server actions", () => {
  it("returns an authentication error for anonymous ZIP inspection and submission", async () => {
    mocks.session.mockResolvedValue(null);
    for (const action of [inspectRecipeMarkdown, submitRecipeMarkdown]) {
      const result = await action(new FormData());
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Anonymous action unexpectedly succeeded.");
      expect(result.message).toMatch(/sign in/i);
    }
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects Markdown submission without the rights confirmation before database writes", async () => {
    const form = new FormData();
    form.set("title", "Research summary recipe");
    form.set("recipeId", "research.summary");
    form.set("version", "1.0.0");
    form.set("summary", "Summarize a research document with clear citations and concise findings.");
    form.set("category", "Research");
    form.set("subcategory", "Academic research");
    form.set("license", "Proprietary");
    expect(await submitRecipeMarkdown(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/permission to submit/i),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires both exact Markdown filenames before inspection", async () => {
    const form = new FormData();
    form.set("title", "Research summary recipe");
    form.set("recipeId", "research.summary");
    form.set("version", "1.0.0");
    form.set("summary", "Summarize a research document with clear citations and concise findings.");
    form.set("category", "Research");
    form.set("subcategory", "Academic research");
    form.set("license", "Proprietary");
    form.set("recipe", new File(["# Draft"], "wrong-name.md"));
    expect(await inspectRecipeMarkdown(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/recipe\.md/i),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects legacy YAML inspection and submission without touching the database", async () => {
    const form = new FormData();
    form.set("recipe", new File(["id: legacy.example"], "recipe.yaml"));
    expect(await inspectRecipeYaml(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/YAML and ZIP uploads are paused/i),
    });
    expect(await submitRecipeYaml(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/YAML and ZIP uploads are paused/i),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects legacy ZIP inspection and submission without touching the database", async () => {
    const form = new FormData();
    form.set("archive", new File([new Uint8Array([1, 2, 3])], "legacy.zip"));
    expect(await inspectRecipeZip(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/YAML and ZIP uploads are paused/i),
    });
    expect(await submitRecipeZip(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/YAML and ZIP uploads are paused/i),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires admin permission before private save and review actions", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("Administrator access required."));
    await expect(savePrivateRecipeVersion({}, false)).rejects.toThrow(/Administrator/);
    await expect(reviewPrivateRecipeVersion("invalid", "approved", "A careful review"))
      .rejects.toThrow(/Administrator/);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
