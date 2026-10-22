import { createId } from "@paralleldrive/cuid2";
import { db } from "@/lib/db";
import { reviewEvent } from "@/lib/db/schema";
import { recipeInspectionAccess } from "@/lib/recipes/access";
import {
  inspectRecipePackage,
  MAX_PACKAGE_BYTES,
  RecipePackageError,
} from "@/lib/recipes/package";
export const runtime = "nodejs";
export const maxDuration = 30;

function response(value: unknown, status: number) {
  return Response.json(value, {
    status,
    headers: {
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex, nofollow",
      ...(status === 429 ? { "Retry-After": "60" } : {}),
    },
  });
}
async function body(request: Request) {
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new RecipePackageError("Send application/json.");
  const reader = request.body?.getReader();
  if (!reader) throw new RecipePackageError("A package body is required.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const chunk = await reader.read();
      if (chunk.done) break;
      bytes += chunk.value.byteLength;
      if (bytes > MAX_PACKAGE_BYTES) {
        await reader.cancel();
        throw new RecipePackageError("The request exceeds the 1 MB limit.");
      }
      chunks.push(chunk.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    return JSON.parse(
      new TextDecoder("utf-8", { fatal: true }).decode(Buffer.concat(chunks)),
    );
  } catch {
    throw new RecipePackageError("Supply valid UTF-8 JSON.");
  }
}
export async function POST(request: Request) {
  try {
    const access = await recipeInspectionAccess(request);
    if (typeof access.status === "number")
      return response({ error: access.error }, access.status);
    try {
      const report = await inspectRecipePackage(await body(request));
      await db.insert(reviewEvent).values({
        id: createId(),
        actorId: access.userId,
        action: "recipe_inspection_completed",
        note: `Static inspection completed: ${report.files.length} files; ${report.issues.length} structural issues; security ${report.security.status}. Nothing published or activated.`,
      });
      return response(report, report.valid ? 200 : 422);
    } catch (error) {
      if (error instanceof RecipePackageError)
        return response({ error: error.message }, 400);
      throw error;
    }
  } catch {
    // No submitted content, stack traces, credentials or database internals in responses.
    return response(
      { error: "Recipe inspection is unavailable. Try again later." },
      503,
    );
  }
}
