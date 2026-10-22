"use client";
import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect } from "react";
function BrowserThemeColor() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (resolvedTheme)
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute(
          "content",
          resolvedTheme === "light" ? "#f6f7fb" : "#101522",
        );
  }, [resolvedTheme]);
  return null;
}
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
      themes={["light", "dark"]}
      storageKey="skillbuffet-theme"
      disableTransitionOnChange
    >
      <BrowserThemeColor />
      {children}
    </NextThemesProvider>
  );
}
