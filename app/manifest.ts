import type { MetadataRoute } from "next";
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Skillbuffet",
    short_name: "Skillbuffet",
    description: "Discover and share reviewed AI agent skills.",
    start_url: "/",
    display: "standalone",
    background_color: "#101522",
    theme_color: "#101522",
    icons: [
      { src: "/brand/192", sizes: "192x192", type: "image/png" },
      { src: "/brand/512", sizes: "512x512", type: "image/png" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" },
    ],
  };
}
