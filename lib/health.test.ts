import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  execute: vi.fn(),
  transaction: vi.fn(),
  hasDatabaseConnection: vi.fn(),
}));
vi.mock("@/lib/db", () => ({
  db: { execute: mocks.execute, transaction: mocks.transaction },
}));
vi.mock("@/lib/db/connection", () => ({ hasDatabaseConnection: mocks.hasDatabaseConnection }));
import { GET } from "@/app/api/health/route";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.hasDatabaseConnection.mockReturnValue(true);
  mocks.execute.mockResolvedValue([{ "?column?": 1 }]);
  let usage = 0;
  const tx = {
    execute: vi.fn().mockResolvedValue(undefined),
    select: vi.fn().mockImplementation(() => ({
      from: () => ({ where: async () => [{ count: usage }] }),
    })),
    insert: vi.fn().mockImplementation(() => ({
      values: async () => { usage += 1; },
    })),
  };
  mocks.transaction.mockImplementation(async (callback) => callback(tx));
});

describe("/api/health", () => {
  it("keeps the plain liveness response exact and does not query the database", async () => {
    const response = await GET(new Request("https://skillbuffet.test/api/health"));
    expect(response.status).toBe(200);
    expect(await response.text()).toBe('{"status":"ok"}');
    expect(mocks.execute).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("reports database readiness after a successful query", async () => {
    const response = await GET(new Request("https://skillbuffet.test/api/health?check=db"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: "healthy" });
    expect(mocks.execute).toHaveBeenCalledTimes(1);
    expect(mocks.transaction).toHaveBeenCalledTimes(1);
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
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("keeps limiter database errors private", async () => {
    mocks.transaction.mockRejectedValue(new Error("sensitive connection details"));
    const response = await GET(new Request("https://skillbuffet.test/api/health?check=db"));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('{"status":"unhealthy"}');
    expect(mocks.execute).not.toHaveBeenCalled();
  });
  it("returns 429 after the shared database-backed limit without another readiness query", async () => {
    vi.stubEnv("HEALTH_DB_CHECKS_PER_MINUTE", "3");
    try {
      const url = "https://skillbuffet.test/api/health?check=db";
      for (let attempt = 0; attempt < 3; attempt++) {
        expect((await GET(new Request(url))).status).toBe(200);
      }
      const response = await GET(new Request(url));
      expect(response.status).toBe(429);
      expect(await response.text()).toBe('{"status":"rate_limited"}');
      expect(response.headers.get("Retry-After")).toBe("60");
      expect(mocks.execute).toHaveBeenCalledTimes(3);
      expect(mocks.transaction).toHaveBeenCalledTimes(4);
    } finally {
      vi.unstubAllEnvs();
    }
  });
});
