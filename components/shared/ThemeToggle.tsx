"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="icon"
        className="h-9 w-9 rounded-xl border-border bg-muted/80 text-muted-foreground hover:bg-accent transition-all shrink-0"
        aria-label="Toggle theme"
      >
        <span className="h-4 w-4 shrink-0" aria-hidden="true" />
      </Button>
    );
  }

  const isDark = theme === "dark";

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="h-9 w-9 rounded-xl border-border bg-muted/80 text-muted-foreground hover:text-foreground hover:bg-accent transition-all shrink-0"
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
    </Button>
  );
}
