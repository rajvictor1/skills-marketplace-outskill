import { load, FAILSAFE_SCHEMA } from "js-yaml";
import { z } from "zod";

import type { ParsedSkillBundle, ParsedSkillFile } from "@/lib/scanner/types";

/**
 * Parse and validate a raw SKILL.md plus any bundled files into the
 * ParsedSkillBundle the scanner expects. Frontmatter must carry name +
 * description (the Agent Skills contract).
 */

export const frontmatterSchema = z
  .object({
    name: z
      .string()
      .min(1, "name is required")
      .max(64, "name must be 64 characters or fewer")
      .regex(
        /^[a-z0-9-]+$/,
        "name must be lowercase letters, numbers, and hyphens only",
      ),
    description: z
      .string()
      .min(1, "description is required")
      .max(1024, "description must be 1024 characters or fewer"),
  })
  .strip();

export type SkillFrontmatter = z.infer<typeof frontmatterSchema>;

export class SkillParseError extends Error {
  constructor(
    message: string,
    public issues?: string[],
  ) {
    super(message);
    this.name = "SkillParseError";
  }
}

const SCRIPT_EXTENSIONS = new Set([
  "sh",
  "bash",
  "zsh",
  "py",
  "js",
  "mjs",
  "cjs",
  "ts",
  "rb",
  "pl",
  "ps1",
  "php",
]);

export function isScriptPath(path: string): boolean {
  const ext = path.split(".").pop()?.toLowerCase() ?? "";
  return SCRIPT_EXTENSIONS.has(ext);
}

export interface RawFile {
  path: string;
  content: string;
  contentType?: string;
}

/**
 * @param skillMdRaw  the full SKILL.md text (frontmatter + body)
 * @param extraFiles  any additional bundled files (NOT including SKILL.md)
 */
export function parseSkill(
  skillMdRaw: string,
  extraFiles: RawFile[] = [],
  meta: { source: "upload" | "github"; sourceUrl?: string } = {
    source: "upload",
  },
): ParsedSkillBundle {
  // Treat frontmatter as data only. Engine selectors such as ---javascript
  // are rejected before parsing; no executable frontmatter library is used.
  const normalized = skillMdRaw.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  const lines = normalized.split("\n");
  if (lines[0]?.trimEnd() !== "---") {
    throw new SkillParseError(
      "SKILL.md must begin with a plain --- YAML frontmatter block. Executable frontmatter is not supported.",
    );
  }
  const closing = lines.findIndex(
    (line, index) => index > 0 && /^---[ \t]*$/.test(line),
  );
  if (closing < 0)
    throw new SkillParseError("Close the YAML frontmatter with a --- line.");
  const yaml = lines.slice(1, closing).join("\n");
  if (Buffer.byteLength(yaml, "utf8") > 16 * 1024)
    throw new SkillParseError("Frontmatter must be smaller than 16 KB.");
  let data: unknown;
  try {
    data = load(yaml, { schema: FAILSAFE_SCHEMA });
  } catch {
    throw new SkillParseError(
      "Could not parse the YAML frontmatter. Use plain YAML data without custom tags.",
    );
  }
  const parsed = { data, content: lines.slice(closing + 1).join("\n") };

  const result = frontmatterSchema.safeParse(parsed.data);
  if (!result.success) {
    throw new SkillParseError(
      "SKILL.md frontmatter is invalid.",
      result.error.issues.map(
        (i) => `${i.path.join(".") || "frontmatter"}: ${i.message}`,
      ),
    );
  }

  const skillMdFile: ParsedSkillFile = {
    path: "SKILL.md",
    content: skillMdRaw,
    contentType: "text/markdown",
    isScript: false,
    sizeBytes: Buffer.byteLength(skillMdRaw, "utf8"),
  };

  const otherFiles: ParsedSkillFile[] = extraFiles.map((f) => ({
    path: f.path,
    content: f.content,
    contentType: f.contentType ?? "text/plain",
    isScript: isScriptPath(f.path),
    sizeBytes: Buffer.byteLength(f.content, "utf8"),
  }));

  return {
    skillMd: {
      frontmatter: result.data,
      body: parsed.content.trim(),
    },
    files: [skillMdFile, ...otherFiles],
    meta,
  };
}
