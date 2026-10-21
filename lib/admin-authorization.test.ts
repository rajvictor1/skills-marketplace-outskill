import { beforeEach, describe, expect, it, vi } from "vitest";
const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  getViewer: vi.fn(),
  isAdmin: vi.fn(),
  session: vi.fn(),
  transaction: vi.fn(),
  select: vi.fn(),
  revalidate: vi.fn(),
}));
vi.mock("@/lib/admin", () => ({
  requireAdmin: mocks.requireAdmin,
  getViewer: mocks.getViewer,
  isAdmin: mocks.isAdmin,
}));
vi.mock("@/lib/auth", () => ({ auth: { api: { getSession: mocks.session } } }));
vi.mock("@/lib/db", () => ({
  db: { transaction: mocks.transaction, select: mocks.select },
}));
vi.mock("next/cache", () => ({ revalidatePath: mocks.revalidate }));
import {
  moderateRating,
  reviewSubmission,
  unpublishSkill,
} from "@/app/actions/admin";
import { rateSkill } from "@/app/actions/rate";
import { POST } from "@/app/api/skills/[slug]/download/route";
function query(result: unknown[]) {
  const chain = {
    from: vi.fn().mockReturnThis(),
    innerJoin: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    for: vi.fn().mockReturnThis(),
    limit: vi.fn().mockResolvedValue(result),
  };
  return chain;
}
function form(values: Record<string, string>) {
  const data = new FormData();
  Object.entries(values).forEach(([key, value]) => data.set(key, value));
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  process.env.DATABASE_URL = "postgresql://test.invalid/not-used";
});
describe("administration authorization", () => {
  it.each([reviewSubmission, unpublishSkill, moderateRating])(
    "denies a non-admin before any mutation",
    async (action) => {
      mocks.requireAdmin.mockRejectedValue(
        new Error("Administrator access required."),
      );
      const result = await action(
        { message: "" },
        form({
          decision: "approved",
          submissionId: "private-id",
          skillId: "private-id",
          ratingId: "private-id",
          note: "Review checked carefully",
        }),
      );
      expect(result.ok).not.toBe(true);
      expect(mocks.transaction).not.toHaveBeenCalled();
    },
  );
  it.each(["blocked", "pending"])("cannot approve a %s scan", async (tier) => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    const update = vi.fn();
    const insert = vi.fn();
    const select = vi
      .fn()
      .mockReturnValueOnce(
        query([
          {
            review: {
              id: "review",
              status: "pending",
              skillId: "skill",
              snapshot: {},
            },
            version: { id: "version", trustTier: tier, scanResultId: "scan" },
          },
        ]),
      )
      .mockReturnValueOnce(query([]));
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        select: vi
          .fn()
          .mockReturnValueOnce(query([{ skillId: "skill" }]))
          .mockReturnValueOnce(query([{ id: "skill" }]))
          .mockImplementation(select),
        update,
        insert,
      }),
    );
    const result = await reviewSubmission(
      { message: "" },
      form({ submissionId: "review", decision: "approved" }),
    );
    expect(result.ok).not.toBe(true);
    expect(update).not.toHaveBeenCalled();
    expect(insert).not.toHaveBeenCalled();
  });
  it("cannot approve a critical finding even with a stale safe trust badge", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    const update = vi.fn();
    const select = vi
      .fn()
      .mockReturnValueOnce(
        query([
          {
            review: {
              id: "review",
              status: "pending",
              skillId: "skill",
              snapshot: {},
            },
            version: {
              id: "version",
              trustTier: "verified_safe",
              scanResultId: "scan",
            },
          },
        ]),
      )
      .mockReturnValueOnce(query([{ id: "critical" }]));
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        select: vi
          .fn()
          .mockReturnValueOnce(query([{ skillId: "skill" }]))
          .mockReturnValueOnce(query([{ id: "skill" }]))
          .mockImplementation(select),
        update,
      }),
    );
    const result = await reviewSubmission(
      { message: "" },
      form({ submissionId: "review", decision: "approved" }),
    );
    expect(result.ok).not.toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
  it("rejects replayed decisions instead of republishing old versions", async () => {
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    const update = vi.fn();
    const select = vi
      .fn()
      .mockReturnValue(
        query([{ review: { status: "approved" }, version: {} }]),
      );
    mocks.transaction.mockImplementation(async (callback) =>
      callback({
        select: vi
          .fn()
          .mockReturnValueOnce(query([{ skillId: "skill" }]))
          .mockReturnValueOnce(query([{ id: "skill" }]))
          .mockImplementation(select),
        update,
      }),
    );
    expect(
      (
        await reviewSubmission(
          { message: "" },
          form({ submissionId: "review", decision: "approved" }),
        )
      ).ok,
    ).not.toBe(true);
    expect(update).not.toHaveBeenCalled();
  });
});
describe("community access", () => {
  it("requires a session before accepting a rating", async () => {
    mocks.getViewer.mockResolvedValue(null);
    expect(
      (
        await rateSkill(
          { message: "" },
          form({ target: "marketplace", stars: "5" }),
        )
      ).ok,
    ).not.toBe(true);
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("rejects out-of-range star values", async () => {
    mocks.getViewer.mockResolvedValue({ user: { id: "user" } });
    expect(
      (
        await rateSkill(
          { message: "" },
          form({ target: "marketplace", stars: "9" }),
        )
      ).ok,
    ).not.toBe(true);
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("excludes administrator self-ratings of the marketplace", async () => {
    mocks.getViewer.mockResolvedValue({ user: { id: "admin" } });
    mocks.isAdmin.mockResolvedValue(true);
    expect(
      (
        await rateSkill(
          { message: "" },
          form({ target: "marketplace", stars: "5" }),
        )
      ).ok,
    ).not.toBe(true);
    expect(mocks.select).not.toHaveBeenCalled();
  });
  it("rejects cross-origin download POSTs before reading identity", async () => {
    const response = await POST(
      new Request("https://skillbuffet.test/api/skills/example/download", {
        method: "POST",
        headers: { origin: "https://other.test" },
      }),
      { params: Promise.resolve({ slug: "example" }) },
    );
    expect(response.status).toBe(403);
    expect(mocks.session).not.toHaveBeenCalled();
  });
  it("redirects anonymous downloads to sign-in without accessing skill contents", async () => {
    mocks.session.mockResolvedValue(null);
    const response = await POST(
      new Request("https://skillbuffet.test/api/skills/private/download", {
        method: "POST",
        headers: { origin: "https://skillbuffet.test" },
      }),
      { params: Promise.resolve({ slug: "private" }) },
    );
    expect(response.status).toBe(303);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});

describe("version approval semantics", () => {
  function transactionForDecision() {
    const snapshot = {
      name: "Approved title",
      description: "Approved description",
      summary: "Approved summary",
      category: "Research",
      subcategory: "Academic research",
      tags: ["research"],
      metadata: { license: "MIT" },
      source: "upload",
    };
    const select = vi
      .fn()
      .mockReturnValueOnce(query([{ skillId: "skill" }]))
      .mockReturnValueOnce(
        query([{ id: "skill", currentVersionId: "previous-approved-version" }]),
      )
      .mockReturnValueOnce(
        query([
          {
            review: {
              id: "review",
              status: "pending",
              skillId: "skill",
              snapshot,
            },
            version: {
              id: "reviewed-version",
              trustTier: "verified_safe",
              scanResultId: "scan",
              versionLabel: "2.0.0",
            },
          },
        ]),
      )
      .mockReturnValueOnce(query([]));
    const set = vi
      .fn()
      .mockReturnValue({ where: vi.fn().mockResolvedValue([]) });
    const update = vi.fn().mockReturnValue({ set });
    const insert = vi
      .fn()
      .mockReturnValue({ values: vi.fn().mockResolvedValue([]) });
    mocks.requireAdmin.mockResolvedValue({ id: "admin" });
    mocks.transaction.mockImplementation(async (callback) =>
      callback({ select, update, insert }),
    );
    return { set, update, insert };
  }
  it("publishes only the exact reviewed version and its saved metadata", async () => {
    const { set } = transactionForDecision();
    const result = await reviewSubmission(
      { message: "" },
      form({ submissionId: "review", decision: "approved" }),
    );
    expect(result.ok).toBe(true);
    expect(set.mock.calls[0][0]).toMatchObject({
      name: "Approved title",
      currentVersionId: "reviewed-version",
      status: "published",
      metadata: { license: "MIT" },
    });
    expect(set.mock.calls[1][0]).toMatchObject({
      status: "approved",
      reviewerId: "admin",
    });
  });
  it("requesting changes leaves the previous public version untouched", async () => {
    const { set } = transactionForDecision();
    const result = await reviewSubmission(
      { message: "" },
      form({
        submissionId: "review",
        decision: "changes_requested",
        note: "Please clarify permissions before approval.",
      }),
    );
    expect(result.ok).toBe(true);
    expect(set).toHaveBeenCalledTimes(1);
    expect(set.mock.calls[0][0]).toMatchObject({ status: "changes_requested" });
    expect(set.mock.calls[0][0]).not.toHaveProperty("currentVersionId");
  });
});
