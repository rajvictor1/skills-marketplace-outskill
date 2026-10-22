import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  access: vi.fn(),
  inspect: vi.fn(),
  insert: vi.fn(),
  getViewer: vi.fn(),
  isAdmin: vi.fn(),
  getPrivateRecipeVersion: vi.fn(),
}));
vi.mock("@/lib/recipes/access", () => ({ recipeInspectionAccess: mocks.access }));
vi.mock("@/lib/recipes/package", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/recipes/package")>()),
  inspectRecipePackage: mocks.inspect,
}));
vi.mock("@/lib/db", () => ({ db: { insert: mocks.insert } }));
vi.mock("@/lib/admin", () => ({ getViewer: mocks.getViewer, isAdmin: mocks.isAdmin }));
vi.mock("@/lib/recipes/storage", () => ({ getPrivateRecipeVersion: mocks.getPrivateRecipeVersion }));

import { POST } from "@/app/api/v1/recipes/validate/route";
import { GET } from "@/app/api/v1/recipes/packages/[id]/route";

const origin = "https://skillbuffet.test";
function request(body = "{}") {
  return new Request(`${origin}/api/v1/recipes/validate`, {
    method: "POST",
    headers: { origin, "content-type": "application/json" },
    body,
  });
}
function packageRequest() {
  return GET(new Request(`${origin}/api/v1/recipes/packages/unknown`), {
    params: Promise.resolve({ id: "unknown" }),
  });
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.insert.mockReturnValue({ values: vi.fn().mockResolvedValue(undefined) });
});

describe("POST /api/v1/recipes/validate", () => {
  it.each([
    [401, "anonymous caller"],
    [403, "non-admin"],
    [403, "wrong origin"],
    [429, "rate-limited caller"],
  ])("returns %i for a %s before reading the package", async (status) => {
    mocks.access.mockResolvedValue({ status, error: "Access denied." });
    const response = await POST(request());
    expect(response.status).toBe(status);
    expect(mocks.inspect).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
    if (status === 429) expect(response.headers.get("Retry-After")).toBe("60");
  });
  it("rejects an oversized body without inspecting or storing it", async () => {
    mocks.access.mockResolvedValue({ userId: "admin" });
    const response = await POST(request("x".repeat(1024 * 1024 + 1)));
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: expect.stringMatching(/1 MB/) });
    expect(mocks.inspect).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});

describe("GET /api/v1/recipes/packages/[id]", () => {
  it("returns 401 to an anonymous caller", async () => {
    mocks.getViewer.mockResolvedValue(null);
    expect((await packageRequest()).status).toBe(401);
    expect(mocks.getPrivateRecipeVersion).not.toHaveBeenCalled();
  });
  it("returns 403 to a signed-in non-admin", async () => {
    mocks.getViewer.mockResolvedValue({ user: { id: "member" } });
    mocks.isAdmin.mockResolvedValue(false);
    expect((await packageRequest()).status).toBe(403);
    expect(mocks.getPrivateRecipeVersion).not.toHaveBeenCalled();
  });
  it("returns 404 when an admin requests an unknown version", async () => {
    mocks.getViewer.mockResolvedValue({ user: { id: "admin" } });
    mocks.isAdmin.mockResolvedValue(true);
    mocks.getPrivateRecipeVersion.mockResolvedValue(null);
    expect((await packageRequest()).status).toBe(404);
  });
});
