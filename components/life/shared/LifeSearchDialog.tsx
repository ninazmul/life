"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, ArrowRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { searchLifeGlobally, GlobalSearchResult } from "@/lib/actions/lifeDashboard.actions";

interface LifeSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LifeSearchDialog({ open, onOpenChange }: LifeSearchDialogProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<GlobalSearchResult[]>([]);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) {
      setQuery("");
      setResults([]);
      return;
    }
  }, [open]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);

    if (val.trim().length < 2) {
      setResults([]);
      return;
    }

    startTransition(async () => {
      const res = await searchLifeGlobally(val);
      setResults(res);
    });
  };

  const handleSelect = (url: string) => {
    onOpenChange(false);
    router.push(url);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl p-0 overflow-hidden border border-slate-800 bg-slate-950/98 backdrop-blur-2xl text-slate-100 shadow-2xl rounded-2xl">
        <DialogHeader className="sr-only">
          <DialogTitle>Global Search</DialogTitle>
        </DialogHeader>

        {/* Search Bar Input */}
        <div className="flex items-center px-4 border-b border-slate-800/80">
          <Search className="w-5 h-5 text-slate-400 shrink-0 mr-3" />
          <Input
            value={query}
            onChange={handleSearch}
            placeholder="Search people, money, notes, businesses, contacts..."
            className="h-14 border-0 bg-transparent text-slate-100 placeholder:text-slate-500 focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
            autoFocus
          />
          {isPending && <Loader2 className="w-4 h-4 text-emerald-400 animate-spin shrink-0" />}
        </div>

        {/* Results List */}
        <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1">
          {query.trim().length < 2 && (
            <div className="py-8 text-center text-xs text-slate-500">
              Type at least 2 characters to search across all Life entities...
            </div>
          )}

          {query.trim().length >= 2 && results.length === 0 && !isPending && (
            <div className="py-8 text-center text-xs text-slate-500">
              No matching records found for &quot;{query}&quot;.
            </div>
          )}

          {results.map((item) => (
            <button
              key={`${item.category}-${item.id}`}
              onClick={() => handleSelect(item.url)}
              className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-900/80 transition-colors text-left group"
            >
              <div className="flex flex-col min-w-0 pr-2">
                <div className="flex items-center gap-2">
                  <span className="text-xs uppercase font-extrabold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700/60 text-[10px]">
                    {item.category}
                  </span>
                  <span className="text-sm font-semibold text-slate-200 truncate group-hover:text-emerald-400 transition-colors">
                    {item.title}
                  </span>
                </div>
                {item.subtitle && (
                  <span className="text-xs text-slate-400 truncate mt-0.5">
                    {item.subtitle}
                  </span>
                )}
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 group-hover:translate-x-1 transition-all shrink-0" />
            </button>
          ))}
        </div>

        {/* Footer shortcuts */}
        <div className="px-4 py-2 border-t border-slate-800/80 bg-slate-900/40 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Search respects resource authorization</span>
          <kbd className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 font-mono text-[10px]">
            ESC to close
          </kbd>
        </div>
      </DialogContent>
    </Dialog>
  );
}
