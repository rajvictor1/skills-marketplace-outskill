"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { consumeRecipeInspectionLimit } from "@/lib/recipes/access";
import { MAX_PACKAGE_BYTES, RecipePackageError } from "@/lib/recipes/package";
import {
  savePrivateRecipeVersion,
  reviewPrivateRecipeVersion,
} from "@/lib/recipes/storage";
export type RecipeActionState = { message: string; ok?: boolean };
function failure(error: unknown): RecipeActionState {
  return {
    message:
      error instanceof RecipePackageError
        ? error.message
        : "Could not save this action. Check your administrator access and try again.",
  };
}
export async function uploadRecipePackage(
  _state: RecipeActionState,
  form: FormData,
): Promise<RecipeActionState> {
  try {
    const admin = await requireAdmin();
    const file = form.get("package");
    if (!(file instanceof File) || !file.size || file.size > MAX_PACKAGE_BYTES)
      throw new RecipePackageError(
        "Choose a prepared JSON package between 1 byte and 1 MB.",
      );
    if (!(await consumeRecipeInspectionLimit(admin.id)))
      throw new RecipePackageError(
        "Inspection limit reached. Try again in one minute.",
      );
    let raw: unknown;
    try {
      raw = JSON.parse(
        new TextDecoder("utf-8", { fatal: true }).decode(
          await file.arrayBuffer(),
        ),
      );
    } catch {
      throw new RecipePackageError("Supply valid UTF-8 JSON.");
    }
    const result = await savePrivateRecipeVersion(
      raw,
      form.get("submit") === "on",
    );
    revalidatePath("/admin/recipes");
    return {
      ok: true,
      message: result.existing
        ? "This exact version is already saved. Use its review controls below."
        : "Recipe version saved privately. Inspect its report below; nothing has been published or activated.",
    };
  } catch (error) {
    return failure(error);
  }
}
export async function reviewRecipePackage(
  _state: RecipeActionState,
  form: FormData,
): Promise<RecipeActionState> {
  try {
    await reviewPrivateRecipeVersion(
      String(form.get("versionId") ?? ""),
      String(form.get("decision") ?? ""),
      String(form.get("note") ?? ""),
    );
    revalidatePath("/admin/recipes");
    return {
      ok: true,
      message:
        "Review recorded. Registry approval does not publish, install or activate this package.",
    };
  } catch (error) {
    return failure(error);
  }
}

export async function stageRecipePublication(
  _state: RecipeActionState,
  form: FormData,
): Promise<RecipeActionState> {
  try {
    const admin = await requireAdmin();
    if (!(await consumeRecipeInspectionLimit(admin.id)))
      throw new RecipePackageError(
        "Inspection limit reached. Try again in one minute.",
      );
    const { prepareRecipePublication } = await import(
      "@/lib/recipes/publication"
    );
    const result = await prepareRecipePublication(
      String(form.get("versionId") ?? ""),
      Object.fromEntries(form),
    );
    revalidatePath("/admin");
    revalidatePath("/admin/recipes");
    return {
      ok: true,
      message: result.existing
        ? "This version already has a marketplace submission. Open the admin review desk to view its status."
        : "Marketplace submission prepared. Open the admin review desk to inspect the files and approve publication. It is not public yet.",
    };
  } catch (error) {
    return failure(error);
  }
}
