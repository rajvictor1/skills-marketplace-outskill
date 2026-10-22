import { afterEach, describe, expect, it } from "vitest";
import { parseSkill, SkillParseError } from "./parse";
afterEach(() => {
  delete process.env.SKILLBUFFET_PARSE_TEST_MARKER;
});
describe("data-only SKILL.md frontmatter", () => {
  it("rejects JavaScript engine selection without executing its code", () => {
    const input =
      '---javascript\n(process.env.SKILLBUFFET_PARSE_TEST_MARKER="executed", {name:"unsafe",description:"unsafe"})\n---\nBody';
    expect(() => parseSkill(input)).toThrow(SkillParseError);
    expect(process.env.SKILLBUFFET_PARSE_TEST_MARKER).toBeUndefined();
  });
  it("rejects custom JavaScript YAML tags", () => {
    expect(() =>
      parseSkill(
        '---\nname: unsafe\ndescription: !!js/function "function(){return 1}"\n---\nBody',
      ),
    ).toThrow(SkillParseError);
  });
  it("accepts BOM and Windows newlines as plain data", () => {
    const result = parseSkill(
      "\uFEFF---\r\nname: example\r\ndescription: A useful example\r\n---\r\n# Body",
    );
    expect(result.skillMd.frontmatter.name).toBe("example");
    expect(result.skillMd.body).toBe("# Body");
  });
  it("rejects unclosed frontmatter", () => {
    expect(() =>
      parseSkill("---\nname: example\ndescription: Example"),
    ).toThrow(SkillParseError);
  });
  it("bounds the parsed metadata size", () => {
    expect(() =>
      parseSkill(
        `---\nname: example\ndescription: Example\nextra: ${"x".repeat(17000)}\n---\nBody`,
      ),
    ).toThrow(SkillParseError);
  });
  it("does not retain unknown object graphs in the validated contract", () => {
    const result = parseSkill(
      "---\nname: example\ndescription: Example\nextra: &loop [*loop]\n---\nBody",
    );
    expect(result.skillMd.frontmatter).toEqual({
      name: "example",
      description: "Example",
    });
  });
});
