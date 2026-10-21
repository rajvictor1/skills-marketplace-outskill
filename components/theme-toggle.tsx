"use client";
import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
const subscribe = () => () => {};
export function ThemeToggle() {
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { resolvedTheme, setTheme } = useTheme();
  const light = mounted && resolvedTheme === "light";
  const label = light ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button
      type="button"
      className="theme-toggle flex size-11 shrink-0 items-center justify-center rounded-xl border border-border bg-card text-foreground hover:bg-secondary disabled:opacity-50"
      disabled={!mounted}
      onClick={() => setTheme(light ? "dark" : "light")}
      aria-label={label}
      title={label}
    >
      <Sun className="size-5 dark:block hidden" aria-hidden="true" />
      <Moon className="size-5 dark:hidden" aria-hidden="true" />
    </button>
  );
}
