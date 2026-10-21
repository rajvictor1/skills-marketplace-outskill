import { getViewer, isAdmin } from "@/lib/admin";
import { getPrivateRecipeVersion } from "@/lib/recipes/storage";
export const runtime = "nodejs";
const headers = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
};
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const viewer = await getViewer();
    if (!viewer?.user)
      return Response.json(
        { error: "Sign in required." },
        { status: 401, headers },
      );
    if (!(await isAdmin(viewer.user.id)))
      return Response.json(
        { error: "Administrator access required." },
        { status: 403, headers },
      );
    const row = await getPrivateRecipeVersion((await params).id);
    if (!row)
      return Response.json(
        { error: "Recipe version not found." },
        { status: 404, headers },
      );
    return Response.json(
      {
        package: row.payload,
        inspection: row.inspection,
        review: { status: row.status, note: row.review_note },
      },
      {
        headers: {
          ...headers,
          "Content-Disposition": `attachment; filename="recipe-${row.id}.json"`,
        },
      },
    );
  } catch {
    return Response.json(
      { error: "Private recipe storage is unavailable." },
      { status: 503, headers },
    );
  }
}
