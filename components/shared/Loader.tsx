"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoaderProps {
  className?: string;
  size?: number;
  label?: string;
  fullScreen?: boolean;
}

export default function Loader({
  className,
  size = 40,
  label = "Loading...",
  fullScreen = false,
}: LoaderProps) {
  const wrapperClass = fullScreen
    ? "fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center"
    : "flex flex-col items-center justify-center min-h-screen";

  return (
    <div
      className={cn(`${wrapperClass} gap-4 text-center`, className)}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <Loader2
        className="animate-spin text-emerald-500 shrink-0"
        style={{ width: size, height: size }}
        strokeWidth={2}
        aria-hidden="true"
      />
      <p className="text-muted-foreground text-sm font-medium">{label}</p>
    </div>
  );
}
