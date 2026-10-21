import { describe, expect, it, vi } from "vitest";
vi.mock("server-only", () => ({}));
import { parseRecipeSample } from "./input-preview";

describe("private recipe sample parser", () => {
  const fields = [
    { name: "request", type: "string" },
    { name: "approval", type: "boolean" },
    { name: "count", type: "integer" },
    { name: "context", type: "complex" },
  ];
  it("preserves typed values while omitting blank optional fields", () => {
    const form = new FormData();
    form.set("mode", "fields");
    form.set("field:request", "Research climate risk");
    form.set("field:approval", "false");
    form.set("field:count", "2");
    form.set("field:context", '{"region":"US"}');
    expect(parseRecipeSample(form, fields)).toEqual({
      request: "Research climate risk",
      approval: false,
      count: 2,
      context: { region: "US" },
    });
  });
  it("rejects non-integer values before schema inspection", () => {
    const form = new FormData();
    form.set("mode", "fields");
    form.set("field:count", "2.2");
    expect(() => parseRecipeSample(form, fields)).toThrow("integer");
  });
  it("rejects malformed complex JSON", () => {
    const form = new FormData();
    form.set("mode", "fields");
    form.set("field:context", "{no}");
    expect(() => parseRecipeSample(form, fields)).toThrow("valid JSON");
  });
  it("requires an object in JSON mode", () => {
    const form = new FormData();
    form.set("mode", "json");
    form.set("sampleJson", "[1,2]");
    expect(() => parseRecipeSample(form, fields)).toThrow("JSON object");
  });
});
