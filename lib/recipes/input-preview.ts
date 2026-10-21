import "server-only";
import { requireAdmin } from "@/lib/admin";
import { consumeRecipeInspectionLimit } from "@/lib/recipes/access";
import {
  inspectRecipePackage,
  RecipePackageError,
} from "@/lib/recipes/package";
import { getPrivateRecipeVersion } from "@/lib/recipes/storage";

function parseObject(text: string): Record<string, unknown> {
  if (Buffer.byteLength(text, "utf8") > 32768)
    throw new RecipePackageError("Sample input must be under 32 KB.");
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    throw new RecipePackageError("Sample input must be valid JSON.");
  }
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new RecipePackageError("Sample input must be a JSON object.");
  return value as Record<string, unknown>;
}
export function parseRecipeSample(
  form: FormData,
  fields: { name: string; type: string }[],
) {
  if (form.get("mode") === "json")
    return parseObject(String(form.get("sampleJson") ?? ""));
  if (form.get("mode") !== "fields")
    throw new RecipePackageError("Choose a sample input format.");
  const sample: Record<string, unknown> = {};
  for (const field of fields) {
    const submitted = form.get(`field:${field.name}`);
    if (typeof submitted !== "string" || submitted.trim() === "") continue;
    if (Buffer.byteLength(submitted, "utf8") > 32768)
      throw new RecipePackageError(`The ${field.name} value exceeds 32 KB.`);
    if (field.type === "string") sample[field.name] = submitted;
    else if (field.type === "boolean") {
      if (!/^(true|false)$/.test(submitted))
        throw new RecipePackageError(
          `The ${field.name} value must be true or false.`,
        );
      sample[field.name] = submitted === "true";
    } else if (field.type === "number" || field.type === "integer") {
      const number = Number(submitted);
      if (
        !Number.isFinite(number) ||
        (field.type === "integer" && !Number.isInteger(number))
      )
        throw new RecipePackageError(
          `The ${field.name} value must be a valid ${field.type}.`,
        );
      sample[field.name] = number;
    } else {
      try {
        sample[field.name] = JSON.parse(submitted);
      } catch {
        throw new RecipePackageError(
          `The ${field.name} value must be valid JSON.`,
        );
      }
    }
  }
  if (Buffer.byteLength(JSON.stringify(sample), "utf8") > 32768)
    throw new RecipePackageError("Sample input must be under 32 KB.");
  return sample;
}
export async function inspectPrivateRecipeInput(id: string, form: FormData) {
  const admin = await requireAdmin();
  if (!(await consumeRecipeInspectionLimit(admin.id)))
    throw new RecipePackageError(
      "Inspection limit reached. Try again in one minute.",
    );
  const source = await getPrivateRecipeVersion(id);
  if (!source)
    throw new RecipePackageError("Private recipe version not found.");
  const sample = parseRecipeSample(form, source.inspection.inputFields);
  const report = await inspectRecipePackage({
    ...source.payload,
    input: sample,
  });
  if (!report.structuralValid || !report.inputValidation)
    throw new RecipePackageError(
      "The bundled input schema needs correction before sample validation.",
    );
  return report.inputValidation;
}
