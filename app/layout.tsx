import { ThemeProvider } from "@/components/theme-provider";
import type { Metadata, Viewport } from "next";
import { SITE_ORIGIN, staticMetadata } from "@/lib/seo/site";
import "./globals.css";

import { SiteNav } from "@/components/site-nav";
import { SiteFooter } from "@/components/site-footer";
import { Toaster } from "@/components/ui/sonner";
import { CookieNotice } from "@/components/cookie-notice";
export const metadata: Metadata = {
  ...staticMetadata("/"),
  alternates: { canonical: null },
  metadataBase: new URL(SITE_ORIGIN),
  applicationName: "Skillbuffet",
  authors: [{ name: "Skillbuffet" }],
  icons: { icon: "/icon.svg", apple: "/brand/180" },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
    other: process.env.BING_SITE_VERIFICATION
      ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION }
      : undefined,
  },
};
export const viewport: Viewport = {
  themeColor: "#101522",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className="h-full antialiased"
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider>
          <a href="#main-content" className="skip-link">
            Skip to content
          </a>
          <SiteNav />
          <div id="main-content" tabIndex={-1} className="flex-1">
            {children}
          </div>
          <SiteFooter />
          <CookieNotice />
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
