import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  isAdmin: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/admin", () => ({ isAdmin: mocks.isAdmin }));
vi.mock("@/lib/db/connection", () => ({ hasDatabaseConnection: () => true }));
vi.mock("@/lib/db", () => ({ db: { transaction: mocks.transaction } }));
import { recipeInspectionAccess } from "@/lib/recipes/access";

const url = "https://skillbuffet.test/api/v1/recipes/validate";
function request(origin = "https://skillbuffet.test") {
  return new Request(url, { method: "POST", headers: { origin } });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({ user: { id: "admin" } });
  mocks.isAdmin.mockResolvedValue(true);
});

describe("recipe validation access", () => {
  it("requires a signed-in session", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await recipeInspectionAccess(request())).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires admin permission", async () => {
    mocks.isAdmin.mockResolvedValue(false);
    expect((await recipeInspectionAccess(request())).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects a wrong origin before consuming the rate limit", async () => {
    expect((await recipeInspectionAccess(request("https://other.test"))).status).toBe(403);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("rejects the seventh validation within one minute", async () => {
    let usage = 0;
    const insert = vi.fn().mockImplementation(() => ({
      values: vi.fn().mockImplementation(async () => { usage += 1; }),
    }));
    const tx = {
      execute: vi.fn().mockResolvedValue(undefined),
      select: vi.fn().mockImplementation(() => ({
        from: () => ({ where: async () => [{ count: usage }] }),
      })),
      insert,
    };
    mocks.transaction.mockImplementation(async (callback) => callback(tx));
    for (let attempt = 0; attempt < 6; attempt++) {
      expect(await recipeInspectionAccess(request())).toEqual({ userId: "admin" });
    }
    expect((await recipeInspectionAccess(request())).status).toBe(429);
    expect(insert).toHaveBeenCalledTimes(6);
  });
});
