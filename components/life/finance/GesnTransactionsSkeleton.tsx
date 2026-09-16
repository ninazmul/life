import { Skeleton } from "@/components/ui/skeleton";

export function GesnTransactionsSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Top Banner Skeleton */}
      <div className="p-4 rounded-2xl border border-border bg-card/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="w-48 h-4 rounded" />
            <Skeleton className="w-72 h-3 rounded" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Skeleton className="w-20 h-8 rounded-xl" />
          <Skeleton className="w-28 h-8 rounded-xl" />
        </div>
      </div>

      {/* Period Selector Skeleton */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="w-20 h-7 rounded-xl flex-shrink-0" />
        ))}
      </div>

      {/* 4 Summary Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-4 rounded-2xl border border-border bg-card space-y-3">
            <div className="flex justify-between items-center">
              <Skeleton className="w-20 h-3 rounded" />
              <Skeleton className="w-6 h-6 rounded-lg" />
            </div>
            <Skeleton className="w-32 h-7 rounded" />
            <Skeleton className="w-24 h-3 rounded" />
            <div className="pt-2 border-t border-border/50 flex justify-between">
              <Skeleton className="w-16 h-3 rounded" />
              <Skeleton className="w-20 h-3 rounded" />
            </div>
          </div>
        ))}
      </div>

      {/* Category Pills Skeleton */}
      <div className="space-y-2">
        <Skeleton className="w-40 h-3 rounded" />
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="w-24 h-7 rounded-xl" />
          ))}
        </div>
      </div>

      {/* Transaction Controls Skeleton */}
      <div className="space-y-3 pt-2">
        <div className="flex justify-between items-center">
          <Skeleton className="w-44 h-5 rounded" />
          <div className="flex gap-2">
            <Skeleton className="w-16 h-7 rounded-xl" />
            <Skeleton className="w-20 h-7 rounded-xl" />
            <Skeleton className="w-20 h-7 rounded-xl" />
          </div>
        </div>
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>

      {/* Transactions List Skeleton */}
      <div className="space-y-2.5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="p-4 rounded-2xl border border-border bg-card flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Skeleton className="w-20 h-4 rounded-full" />
                  <Skeleton className="w-16 h-4 rounded" />
                </div>
                <Skeleton className="w-48 h-4 rounded" />
                <Skeleton className="w-24 h-3 rounded" />
              </div>
            </div>
            <div className="space-y-1 text-right">
              <Skeleton className="w-24 h-6 rounded ml-auto" />
              <Skeleton className="w-16 h-3 rounded ml-auto" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
