import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Outskill | Security-first AI skills marketplace",
  description:
    "Browse, inspect, and publish vetted AI-agent skills with visible trust badges.",
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
