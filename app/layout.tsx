import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Claude Directory | Skills, tools, and extensions",
  description:
    "Browse installable Claude Code, Clawdbot, and AI-agent skills with search, categories, tags, and copy-ready commands.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
