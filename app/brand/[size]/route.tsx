import { ImageResponse } from "next/og";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ size: string }> },
) {
  const size = Number((await params).size);
  if (![180, 192, 512].includes(size))
    return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          background: "#151c2b",
          color: "#b8adff",
          borderRadius: size * 0.18,
        }}
      >
        <svg
          width={size * 0.68}
          height={size * 0.68}
          viewBox="0 0 24 24"
          fill="none"
          stroke="#b8adff"
          strokeWidth="1.7"
        >
          <path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6L12 2Z" />
          <path d="m8 12 3 3 5-6" />
        </svg>
      </div>
    ),
    {
      width: size,
      height: size,
      headers: { "Cache-Control": "public, max-age=86400" },
    },
  );
}
