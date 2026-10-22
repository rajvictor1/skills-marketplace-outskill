import { getViewer, isAdmin } from "@/lib/admin";
export async function GET() {
  try {
    const session = await getViewer();
    return Response.json(
      {
        authenticated: Boolean(session?.user),
        admin: session?.user ? await isAdmin(session.user.id) : false,
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return Response.json(
      { authenticated: false, admin: false },
      { status: 503 },
    );
  }
}
