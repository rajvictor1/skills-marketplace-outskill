import { describe, expect, it } from "vitest";
import { scrubSentryEvent } from "./sentry-scrub";

describe("scrubSentryEvent", () => {
  it("removes request, user, breadcrumb, and payload fields", () => {
    const event = {
      request: { url: "https://example.test/private?token=secret", cookies: "secret" },
      user: { id: "user-123", email: "person@example.test" },
      extra: { body: "private form data" },
      breadcrumbs: [{ message: "private navigation" }],
      contexts: { user: { email: "person@example.test" } },
      tags: { session: "private" },
      message: "submitted customer@example.test",
      logentry: { message: "private payload" },
      transaction: "/account/private-id",
      culprit: "private source input",
      debug_meta: { images: [{ code_file: "private" }] },
      sdkProcessingMetadata: { request: { url: "private" } },
      exception: {
        values: [
          {
            type: "Error",
            value: "Customer customer@example.test submitted secret",
            stacktrace: {
              frames: [
                {
                  filename: "app/route.ts",
                  lineno: 42,
                  vars: { token: "secret" },
                  pre_context: ["private source line"],
                  context_line: "private source line",
                  post_context: ["private source line"],
                },
              ],
            },
          },
        ],
      },
    };

    const safe = scrubSentryEvent(event);

    expect(safe).not.toHaveProperty("request");
    expect(safe).not.toHaveProperty("user");
    expect(safe).not.toHaveProperty("extra");
    expect(safe).not.toHaveProperty("breadcrumbs");
    expect(safe).not.toHaveProperty("contexts");
    expect(safe).not.toHaveProperty("tags");
    expect(safe).not.toHaveProperty("message");
    expect(safe).not.toHaveProperty("logentry");
    expect(safe).not.toHaveProperty("transaction");
    expect(safe.exception?.values?.[0]).toMatchObject({
      type: "Error",
      value: "[redacted]",
      stacktrace: { frames: [{ filename: "app/route.ts", lineno: 42 }] },
    });
    expect(safe.exception?.values?.[0]?.stacktrace?.frames?.[0]).not.toHaveProperty("vars");
  });

  it("accepts events without exception details", () => {
    expect(scrubSentryEvent({ event_id: "safe" })).toEqual({ event_id: "safe" });
  });
});
