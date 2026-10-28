import { createHash } from "node:crypto";
import { posix } from "node:path";
import { load, JSON_SCHEMA } from "js-yaml";
import Ajv from "ajv";
import Ajv2020 from "ajv/dist/2020";
import addFormats from "ajv-formats";
import { z } from "zod";
import { scanSkill } from "@/lib/scanner";
import { isScriptPath } from "@/lib/skills/parse";
import type { ParsedSkillBundle } from "@/lib/scanner/types";

export const MAX_PACKAGE_BYTES = 1024 * 1024;
const identifier = z
  .string()
  .min(1)
  .max(160)
  .regex(/^[a-z0-9][a-z0-9._-]*$/);
const fields = z.array(z.string().min(1).max(160)).max(100);
export const recipeManifestSchema = z.looseObject({
  id: identifier,
  version: z.string().regex(/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/),
  description: z.string().min(1).max(2048),
  provides: fields.min(1),
  requires: fields,
  optional: fields.optional(),
  dependencies: z.array(identifier).max(50),
  preconditions: z.array(z.string().max(1000)).max(50),
  side_effects: z.enum([
    "none",
    "external_write",
    "external_write_final_gated",
  ]),
  permissions: fields,
  adapter: z.string().min(1).max(160),
  // A standalone recipe.yaml can carry schemas inline. File paths remain the
  // preferred format for multi-file ZIP packages.
  input_schema: z.union([
    z.string().min(1).max(240),
    z.record(z.string(), z.unknown()),
  ]),
  output_schema: z.union([
    z.string().min(1).max(240),
    z.record(z.string(), z.unknown()),
  ]),
  human_gate: z
    .object({
      actor: z.string().min(1).max(160),
      transition: z.string().min(1).max(500),
    })
    .optional(),
  timeout_ms: z.number().int().min(1).max(300000).optional(),
});
const envelopeSchema = z.strictObject({
  files: z
    .array(
      z.strictObject({
        path: z.string().min(1).max(240),
        content: z.string().max(256 * 1024),
      }),
    )
    .min(1)
    .max(256),
  manifestPath: z.string().max(240).optional(),
  input: z.record(z.string(), z.unknown()).optional(),
});
export type PackageEnvelope = z.infer<typeof envelopeSchema>;
export type RecipeIssue = {
  file: string;
  path: string;
  code: string;
  message: string;
};
export class RecipePackageError extends Error {}

function safePath(path: string) {
  return (
    /^[A-Za-z0-9_./-]+$/.test(path) &&
    !path.startsWith("/") &&
    path
      .split("/")
      .every(
        (p) =>
          p !== "" &&
          p !== "." &&
          p !== ".." &&
          !["__proto__", "prototype", "constructor"].includes(p),
      )
  );
}
function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function parseYaml(text: string): unknown {
  // JSON_SCHEMA permits plain YAML data only; custom executable tags are disabled.
  const value: unknown = load(text, { schema: JSON_SCHEMA, json: false });
  let nodes = 0;
  const active = new WeakSet<object>();
  function visit(v: unknown, depth: number): void {
    if (++nodes > 15000 || depth > 24) throw new Error("YAML is too complex.");
    if (typeof v !== "object" || v === null) return;
    if (active.has(v))
      throw new Error("Recursive YAML aliases are not supported.");
    active.add(v);
    for (const [key, item] of Object.entries(v)) {
      if (["__proto__", "constructor", "prototype"].includes(key))
        throw new Error("Unsafe YAML key.");
      visit(item, depth + 1);
    }
    active.delete(v);
  }
  visit(value, 0);
  return value;
}

/** Schemas resolve only inside the supplied package. No fetch or custom keywords. */
function schemaCompiler(files: Map<string, string>, allErrors = false) {
  const ajv = new Ajv2020({
    strict: true,
    strictRequired: false,
    strictTypes: false,
    allErrors,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    inlineRefs: false,
  });
  const legacy = new Ajv({
    strict: true,
    strictRequired: false,
    strictTypes: false,
    allErrors,
    coerceTypes: false,
    useDefaults: false,
    removeAdditional: false,
    inlineRefs: false,
  });
  addFormats(ajv, [
    "date-time",
    "date",
    "time",
    "uri",
    "uri-reference",
    "uuid",
    "email",
  ]);
  addFormats(legacy, [
    "date-time",
    "date",
    "time",
    "uri",
    "uri-reference",
    "uuid",
    "email",
  ]);
  const schemas = new Map<
    string,
    { schema: Record<string, unknown>; legacy: boolean }
  >();
  const base = "https://recipe.invalid/";
  const safePatterns = new Set([
    "^\\d+(\\.\\d+)?$",
    "^[A-Z]{3}$",
    "^[a-f0-9]{64}$",
    "^([01][0-9]|2[0-3]):[0-5][0-9]$",
    "^unimplemented:[a-z.]+$",
  ]);
  for (const [path, text] of files) {
    if (!path.endsWith(".schema.json")) continue;
    if (schemas.size >= 128 || Buffer.byteLength(text) > 128 * 1024)
      throw new Error("Schema collection exceeds the import limits.");
    const value: unknown = JSON.parse(text);
    if (!object(value)) throw new Error("Expected JSON Schema objects.");
    let nodes = 0;
    const visit = (v: unknown, depth: number): void => {
      if (++nodes > 15000 || depth > 32)
        throw new Error("Schema exceeds supported complexity.");
      if (Array.isArray(v)) {
        v.forEach((item) => visit(item, depth + 1));
        return;
      }
      if (!object(v)) return;
      for (const [key, item] of Object.entries(v)) {
        if (
          [
            "$dynamicRef",
            "$recursiveRef",
            "$async",
            "$id",
            "patternProperties",
            "__proto__",
            "constructor",
            "prototype",
          ].includes(key)
        )
          throw new Error("Unsupported schema keyword or unsafe property.");
        if (key === "$ref") {
          if (
            typeof item !== "string" ||
            /[:\\?]/.test(item) ||
            item.startsWith("/")
          )
            throw new Error("Schema references must stay inside the package.");
          const target = item.split("#")[0];
          if (
            target &&
            !files.has(posix.normalize(posix.join(posix.dirname(path), target)))
          )
            throw new Error("Unresolved local schema reference.");
        }
        if (
          key === "pattern" &&
          (typeof item !== "string" ||
            (!safePatterns.has(item) &&
              !/^\^[A-Za-z0-9_\\.\/-]+\$?$/.test(item)))
        )
          throw new Error(
            "Pattern requires review under the bounded schema profile.",
          );
        visit(item, depth + 1);
      }
    };
    visit(value, 0);
    const dialect = value.$schema;
    if (
      dialect !== undefined &&
      dialect !== "https://json-schema.org/draft/2020-12/schema" &&
      dialect !== "http://json-schema.org/draft-07/schema#"
    )
      throw new Error("Unsupported JSON Schema dialect.");
    const old = dialect === "http://json-schema.org/draft-07/schema#";
    schemas.set(path, { schema: value, legacy: old });
    (old ? legacy : ajv).addSchema(value, base + path);
  }
  return (path: string) => {
    const entry = schemas.get(path);
    if (!entry) throw new Error("Referenced JSON Schema is missing.");
    const validate = (entry.legacy ? legacy : ajv).getSchema(base + path);
    if (!validate) throw new Error("Schema could not be compiled.");
    return { schema: entry.schema, validate };
  };
}

export async function inspectRecipePackage(raw: unknown) {
  const envelope = envelopeSchema.safeParse(raw);
  if (!envelope.success)
    throw new RecipePackageError(
      "Expected { files: [{ path, content }], input? }, with 1–256 UTF-8 text files.",
    );
  const { files, input } = envelope.data;
  if (input !== undefined) {
    let nodes = 0;
    const visit = (v: unknown, depth: number): void => {
      if (++nodes > 10000 || depth > 24)
        throw new RecipePackageError(
          "Input exceeds the supported depth or node limit.",
        );
      if (typeof v === "string" && v.length > 32768)
        throw new RecipePackageError("Input strings must be at most 32 KB.");
      if (Array.isArray(v)) v.forEach((item) => visit(item, depth + 1));
      else if (object(v))
        for (const [key, item] of Object.entries(v)) {
          if (["__proto__", "constructor", "prototype"].includes(key))
            throw new RecipePackageError("Unsafe input property.");
          visit(item, depth + 1);
        }
    };
    visit(input, 0);
  }
  if (
    Buffer.byteLength(JSON.stringify(envelope.data), "utf8") > MAX_PACKAGE_BYTES
  )
    throw new RecipePackageError("The package exceeds the 1 MB limit.");
  const paths = new Set<string>();
  for (const file of files) {
    if (!safePath(file.path))
      throw new RecipePackageError(
        "Package paths must be relative, without traversal or ambiguous segments.",
      );
    const key = file.path.toLowerCase();
    if (paths.has(key))
      throw new RecipePackageError(
        "Duplicate or case-colliding file paths are not allowed.",
      );
    if (!/\.(md|txt|json|ya?ml|py|js|ts|sh)$/i.test(file.path))
      throw new RecipePackageError(
        "Only supported text documentation, schema and adapter files can be inspected.",
      );
    if (file.content.includes("\u0000"))
      throw new RecipePackageError(
        "Binary files are not accepted by the text-package importer.",
      );
    if (
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_[A-Za-z0-9]{30,}|sk-ant-[A-Za-z0-9_-]{30,}|AKIA[A-Z0-9]{16})\b/.test(
        file.content,
      )
    )
      throw new RecipePackageError(
        "Potential credentials found. Remove them before importing this package.",
      );
    paths.add(key);
  }
  const byPath = new Map(files.map((f) => [f.path, f.content]));
  const manifestPath = envelope.data.manifestPath ?? "recipe.yaml";
  if (!safePath(manifestPath))
    throw new RecipePackageError("Invalid manifest path.");
  const yaml = byPath.get(manifestPath);
  const instructions =
    byPath.get(posix.join(posix.dirname(manifestPath), "SKILL.md")) ??
    byPath.get("SKILL.md") ??
    "";
  if (!yaml)
    throw new RecipePackageError(
      "The selected recipe.yaml must be included in the package.",
    );
  if (Buffer.byteLength(yaml) > 32 * 1024)
    throw new RecipePackageError("recipe.yaml must be smaller than 32 KB.");
  const issues: RecipeIssue[] = [];
  const warnings: string[] = [];
  const issue = (file: string, path: string, code: string, message: string) =>
    issues.push({ file, path, code, message });
  let manifest: unknown;
  try {
    manifest = parseYaml(yaml);
  } catch {
    throw new RecipePackageError(
      "recipe.yaml must contain plain, non-duplicated YAML data without executable tags.",
    );
  }
  if (!object(manifest))
    throw new RecipePackageError("recipe.yaml must define an object.");
  const parsed = recipeManifestSchema.safeParse(manifest);
  if (!parsed.success)
    for (const e of parsed.error.issues)
      issue("recipe.yaml", e.path.join("."), "manifest_type", e.message);
  if (manifest.skillport_standard !== undefined)
    warnings.push("The skillport_standard YAML block is a conceptual authoring example, not an approved platform schema. It is preserved but not treated as a verified runtime contract.");
  warnings.push("This YAML package uses Skillbuffet's current structural checks. It does not by itself satisfy the manager's required recipe.md plus separate validation-report.md deliverables.");
  const manifestId = typeof manifest.id === "string" ? manifest.id : null;
  const dependencyIds = Array.isArray(manifest.dependencies)
    ? manifest.dependencies.filter((v): v is string => typeof v === "string")
    : [];
  if (manifestId && dependencyIds.includes(manifestId))
    issue(
      "recipe.yaml",
      "dependencies",
      "self_dependency",
      "A recipe cannot depend on itself.",
    );
  if (manifest.side_effects === "external_write_final_gated") {
    const gate = manifest.human_gate;
    if (
      !object(gate) ||
      typeof gate.actor !== "string" ||
      !gate.actor.trim() ||
      /^(?:ai|agent|model|assistant)$/i.test(gate.actor.trim()) ||
      typeof gate.transition !== "string" ||
      !gate.transition.trim()
    )
      issue(
        "recipe.yaml",
        "human_gate",
        "human_gate_required",
        "Write-capable recipes need a named human role and explicit final transition. A declaration is not runtime enforcement.",
      );
  }
  const runtimeBlockers = [
    "Adapter registration and runtime activation have not been verified.",
  ];
  if (
    typeof manifest.adapter !== "string" ||
    /TBD|pending|placeholder|unimplemented:/i.test(String(manifest.adapter))
  )
    runtimeBlockers.push("The supplied adapter is a placeholder.");
  if (manifest.implementation_status === "contract_only")
    runtimeBlockers.push(
      "The source explicitly declares this recipe contract-only.",
    );
  if (
    manifest.side_effects === "external_write" &&
    (!object(manifest.approval) ||
      manifest.approval.required !== true ||
      manifest.approval.mode !== "exact_action_or_scoped_standing_policy")
  )
    issue(
      manifestPath,
      "approval",
      "approval_required",
      "External writes need an explicit approval policy; runtime enforcement is still required.",
    );
  const schemaFiles = new Map(byPath);
  const inlineSchemaPaths = new Map<string, string>();
  for (const field of ["input_schema", "output_schema"] as const) {
    const schema = manifest[field];
    if (object(schema)) {
      const path = `__inline__/${field}.schema.json`;
      schemaFiles.set(path, JSON.stringify(schema));
      inlineSchemaPaths.set(field, path);
    }
  }
  let compile: ReturnType<typeof schemaCompiler> | undefined;
  try {
    compile = schemaCompiler(schemaFiles);
  } catch {
    issue(
      "schemas",
      "",
      "unsupported_schema_collection",
      "The schema collection has invalid JSON, unresolved references or constructs outside the bounded import profile.",
    );
  }
  const schemaResults: Record<
    string,
    ReturnType<ReturnType<typeof schemaCompiler>>
  > = {};
  for (const [field, path] of [
    ["input_schema", manifest.input_schema],
    ["output_schema", manifest.output_schema],
  ] as const) {
    const inlinePath = inlineSchemaPaths.get(field);
    const resolvedPath = inlinePath ?? (
      typeof path === "string"
        ? byPath.has(path)
          ? path
          : posix.join(posix.dirname(manifestPath), path)
        : ""
    );
    if (
      (!inlinePath && (typeof path !== "string" || !path || !safePath(path))) ||
      !schemaFiles.has(resolvedPath)
    ) {
      issue(
        "recipe.yaml",
        field,
        "missing_schema",
        "Reference a bundled input/output JSON Schema file.",
      );
      continue;
    }
    try {
      schemaResults[field] = compile!(resolvedPath);
    } catch {
      issue(
        typeof path === "string" ? path : field,
        "",
        "unsupported_schema",
        "The schema is invalid or outside the supported bounded schema profile. See the recipe-package documentation.",
      );
    }
  }
  const declaredSchemaPath = byPath.has(
    posix.join(
      posix.dirname(manifestPath),
      "schemas/recipe-manifest.schema.json",
    ),
  )
    ? posix.join(
        posix.dirname(manifestPath),
        "schemas/recipe-manifest.schema.json",
      )
    : "schemas/recipe-manifest.schema.json";
  const declaredSchema = byPath.get(declaredSchemaPath);
  if (declaredSchema) {
    try {
      const validator = schemaCompiler(
        byPath,
        true,
      )(declaredSchemaPath).validate;
      if (!validator(manifest))
        for (const e of validator.errors ?? [])
          issue(
            "recipe.yaml",
            e.instancePath || "/",
            "declared_schema",
            `The supplied manifest schema rejects this value (${e.keyword}).`,
          );
    } catch {
      issue(
        "schemas/recipe-manifest.schema.json",
        "",
        "unsupported_schema",
        "The supplied manifest schema is invalid or outside the bounded import profile.",
      );
    }
  }
  const frontmatter = instructions
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n")
    .match(/^---\n([\s\S]*?)\n---(?:\n|$)/);
  if (!instructions)
    warnings.push(
      "This contract package has no SKILL.md. A marketplace description can be derived from manifest metadata; agent-skill compatibility is not implied.",
    );
  else if (!frontmatter)
    issue(
      "SKILL.md",
      "",
      "missing_frontmatter",
      "Include plain YAML frontmatter with a name, description and matching version.",
    );
  else {
    try {
      const fm = parseYaml(frontmatter[1]);
      if (
        !object(fm) ||
        typeof fm.name !== "string" ||
        typeof fm.description !== "string"
      )
        issue(
          "SKILL.md",
          "",
          "invalid_frontmatter",
          "Name and description must be strings.",
        );
      else {
        if (fm.version === undefined || String(fm.version) !== manifest.version)
          issue(
            "SKILL.md",
            "version",
            "version_mismatch",
            "Documentation and recipe manifest must declare the same version.",
          );
        if (!/^[a-z0-9-]+$/.test(fm.name))
          warnings.push(
            "The original document name is preserved, but is not a standard lowercase-and-hyphens agent-skill ID. A separate marketplace slug will be needed.",
          );
      }
    } catch {
      issue(
        "SKILL.md",
        "",
        "invalid_frontmatter",
        "Frontmatter must contain plain YAML data.",
      );
    }
  }
  const inputSchema = schemaResults.input_schema;
  let inputValidation: {
    valid: boolean;
    issues: { path: string; keyword: string; missingProperty?: string }[];
  } | null = null;
  if (input !== undefined && inputSchema) {
    const valid = Boolean(inputSchema.validate(input));
    inputValidation = {
      valid,
      issues: (inputSchema.validate.errors ?? []).map((e) => ({
        path: e.instancePath,
        keyword: e.keyword,
        ...(typeof e.params.missingProperty === "string"
          ? { missingProperty: e.params.missingProperty }
          : {}),
      })),
    };
  }
  const properties = object(inputSchema?.schema.properties)
    ? inputSchema.schema.properties
    : {};
  const required = Array.isArray(inputSchema?.schema.required)
    ? inputSchema.schema.required
    : [];
  const inputFields = Object.entries(properties).map(([name, value]) => ({
    name,
    required: required.includes(name),
    type:
      object(value) && typeof value.type === "string" ? value.type : "complex",
    title:
      object(value) && typeof value.title === "string" ? value.title : name,
  }));
  if (Array.isArray(manifest.requires))
    for (const name of manifest.requires)
      if (typeof name === "string" && !(name in properties))
        warnings.push(
          `Declared required input '${name}' has no matching top-level input schema property; mappings need review.`,
        );
  const bundle: ParsedSkillBundle = {
    skillMd: {
      frontmatter: {
        name: manifestId ?? "unresolved-recipe",
        description:
          typeof manifest.description === "string"
            ? manifest.description
            : "Recipe package requiring review",
      },
      body: instructions || yaml,
    },
    files: files.map((f) => ({
      ...f,
      contentType: f.path.endsWith(".json") ? "application/json" : "text/plain",
      isScript: isScriptPath(f.path),
      sizeBytes: Buffer.byteLength(f.content, "utf8"),
    })),
    meta: { source: "upload" },
  };
  // Deterministic inspection only. No adapter execution and no transfer to an LLM provider.
  const scan = await scanSkill(bundle);
  const codeFiles = files
    .filter((f) => isScriptPath(f.path))
    .map((f) => f.path);
  warnings.push(
    "Adapter registration, dependency resolution, provider consent and runtime readiness have not been verified. Source claims and supplied test logs are not independent verification.",
  );
  if (!Array.isArray(manifest.steps))
    warnings.push(
      "recipe.yaml contains capability metadata, not an executable step graph. A runtime adapter or separately validated workflow definition is still required.",
    );
  return {
    contractVersion: "skillbuffet-recipe-inspection-v1",
    riskScore: scan.riskScore,
    permissions: Array.isArray(manifest.permissions)
      ? manifest.permissions.filter(
          (value): value is string => typeof value === "string",
        )
      : [],
    recipeId: manifestId,
    title: typeof manifest.title === "string" ? manifest.title : null,
    description: typeof manifest.description === "string" ? manifest.description : null,
    version: typeof manifest.version === "string" ? manifest.version : null,
    valid: issues.length === 0 && scan.trustTier !== "blocked",
    structuralValid: issues.length === 0,
    issues,
    warnings,
    packageHash: createHash("sha256")
      .update(
        JSON.stringify(
          [...files].sort((a, b) =>
            a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
          ),
        ),
      )
      .digest("hex"),
    files: files.map((f) => ({
      path: f.path,
      bytes: Buffer.byteLength(f.content),
      executable: isScriptPath(f.path),
    })),
    inputFields,
    inputValidation,
    dependencies: dependencyIds,
    adapterCodeFiles: codeFiles,
    security: {
      status:
        scan.trustTier === "blocked"
          ? "blocked"
          : scan.trustTier === "caution"
            ? "review_required"
            : "static_checks_passed",
      scannerVersion: scan.scannerVersion,
      layers: scan.layerStatus,
      findings: scan.findings.map(
        ({ layer, severity, category, title, filePath }) => ({
          layer,
          severity,
          category,
          title,
          filePath,
        }),
      ),
    },
    runtimeBlockers,
    readiness: {
      published: false,
      installed: false,
      runtimeVerified: false,
      active: false,
    },
  };
}
