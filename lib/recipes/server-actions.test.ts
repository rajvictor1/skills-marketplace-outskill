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

import { inspectRecipeZip, submitRecipeZip } from "@/app/actions/recipe-zip";
import { reviewPrivateRecipeVersion, savePrivateRecipeVersion } from "@/lib/recipes/storage";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "creator" } });
  mocks.limit.mockResolvedValue(true);
});

describe("recipe server actions", () => {
  it("returns an authentication error for anonymous ZIP inspection and submission", async () => {
    mocks.session.mockResolvedValue(null);
    for (const action of [inspectRecipeZip, submitRecipeZip]) {
      const result = await action(new FormData());
      expect(result.ok).toBe(false);
      if (result.ok) throw new Error("Anonymous action unexpectedly succeeded.");
      expect(result.message).toMatch(/sign in/i);
    }
    expect(mocks.limit).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("returns a rate-limit error before reading uploaded ZIP contents", async () => {
    mocks.limit.mockResolvedValue(false);
    expect(await inspectRecipeZip(new FormData())).toMatchObject({
      ok: false, message: expect.stringMatching(/limit reached/i),
    });
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects an oversized ZIP before any database mutation", async () => {
    const form = new FormData();
    form.set("archive", new File([new Uint8Array(1_500_001)], "recipe.zip"));
    expect(await inspectRecipeZip(form)).toMatchObject({
      ok: false, message: expect.stringMatching(/smaller than 1.5 MB/),
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
