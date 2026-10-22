import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ execute: vi.fn(), hasDatabaseConnection: vi.fn() }));
vi.mock("@/lib/db", () => ({ db: { execute: mocks.execute } }));
vi.mock("@/lib/db/connection", () => ({ hasDatabaseConnection: mocks.hasDatabaseConnection }));
import { GET } from "@/app/api/health/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasDatabaseConnection.mockReturnValue(true);
  mocks.execute.mockResolvedValue([{ "?column?": 1 }]);
});

describe("/api/health", () => {
  it("keeps the plain liveness response exact and does not query the database", async () => {
    const response = await GET(new Request("https://skillbuffet.test/api/health"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"status":"ok"}');
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("reports database readiness after a successful query", async () => {
    const response = await GET(new Request("https://skillbuffet.test/api/health?check=db"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "ok" });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
  });
  it("returns only a generic unhealthy status when the query fails", async () => {
    mocks.execute.mockRejectedValue(new Error("sensitive connection details"));
    const response = await GET(new Request("https://skillbuffet.test/api/health?check=db"));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"status":"unhealthy"}');
  });
  it("returns unhealthy without querying when no database is configured", async () => {
    mocks.hasDatabaseConnection.mockReturnValue(false);
    const response = await GET(new Request("https://skillbuffet.test/api/health?check=db"));
    expect(response.status).toBe(503);
    expect(await response.json()).toEqual({ status: "unhealthy" });
    expect(mocks.execute).not.toHaveBeenCalled();
  });
});
