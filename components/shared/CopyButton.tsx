"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "react-hot-toast";

interface CopyButtonProps {
  text: string;
  label?: string;
  className?: string;
  iconSize?: "sm" | "md" | "lg";
}

const SIZE_MAP: Record<string, string> = {
  sm: "w-3 h-3",
  md: "w-3.5 h-3.5",
  lg: "w-4 h-4",
};

export function CopyButton({
  text,
  label,
  className = "",
  iconSize = "md",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`Copied ${label || "value"} to clipboard`, {
        iconTheme: { primary: "#10b981", secondary: "#ffffff" },
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy — clipboard unavailable");
    }
  };

  const displayLabel = label || (text.length > 24 ? `${text.slice(0, 24)}…` : text);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`inline-flex items-center justify-center p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0 ${className}`}
      title={`Copy ${displayLabel}`}
      aria-label={copied ? `Copied ${displayLabel}` : `Copy ${displayLabel}`}
      aria-live="polite"
    >
      {copied ? (
        <Check
          className={`${SIZE_MAP[iconSize]} text-emerald-600 dark:text-emerald-400 shrink-0`}
          strokeWidth={2.25}
          aria-hidden="true"
        />
      ) : (
        <Copy
          className={`${SIZE_MAP[iconSize]} shrink-0`}
          strokeWidth={2}
          aria-hidden="true"
        />
      )}
    </button>
  );
}
