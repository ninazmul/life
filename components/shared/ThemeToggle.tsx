"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        type="button"
        disabled
        className="h-9 w-9 rounded-xl border border-border bg-card/60 dark:bg-muted/40 text-muted-foreground transition-all shrink-0 flex items-center justify-center opacity-70"
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      </button>
    );
  }

  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 rounded-xl border border-border bg-card/60 dark:bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-muted/80 active:scale-95 transition-all shrink-0 flex items-center justify-center"
      title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
      aria-label={
        isDark
          ? "Switch to Light Mode (currently dark)"
          : "Switch to Dark Mode (currently light)"
      }
      aria-pressed={isDark}
    >
      {isDark ? (
        <Sun
          className="h-4 w-4 text-amber-500 transition-all shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      ) : (
        <Moon
          className="h-4 w-4 transition-all shrink-0"
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
