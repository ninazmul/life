/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useTransition, useEffect, useRef, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  ExternalLink,
  Search,
  Receipt,
  Tag,
  CreditCard,
  Building,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  Filter,
  BarChart3,
  Percent,
  CheckCircle2,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Loader2,
  Sparkles,
  SlidersHorizontal,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  IGesnReportsData,
  IGesnTransactionItem,
  IGesnCategorySummary,
} from "@/types/gesnReports";
import { getGesnReports } from "@/lib/actions/gesnReports.actions";
import toast from "react-hot-toast";

interface GesnTransactionsViewProps {
  initialData?: IGesnReportsData | null;
  initialError?: string | null;
}

const PERIOD_OPTIONS = [
  { label: "This Month", value: "thisMonth" },
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7days" },
  { label: "Last 30 Days", value: "last30days" },
  { label: "Last Month", value: "lastMonth" },
  { label: "This Year", value: "thisYear" },
  { label: "All Time", value: "all" },
];

const PAGE_SIZE_OPTIONS = [10, 15, 25, 50];

export function GesnTransactionsView({
  initialData,
  initialError,
}: GesnTransactionsViewProps) {
  const [data, setData] = useState<IGesnReportsData | null>(initialData || null);
  const [error, setError] = useState<string | null>(initialError || null);
  const [activePeriod, setActivePeriod] = useState<string>("thisMonth");
  const [transactionTypeFilter, setTransactionTypeFilter] = useState<"all" | "income" | "expense">("all");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showMonthlyBreakdown, setShowMonthlyBreakdown] = useState<boolean>(false);
  const [isPending, startTransition] = useTransition();

  // Pagination & Lazy Loading States
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(15);
  const [viewMode, setViewMode] = useState<"paginated" | "infinite">("paginated");
  const [visibleCount, setVisibleCount] = useState<number>(15);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreSentinelRef = useRef<HTMLDivElement | null>(null);

  const handlePeriodChange = (period: string) => {
    setActivePeriod(period);
    startTransition(async () => {
      try {
        const res = await getGesnReports({ period });
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
          toast.success(`Loaded reports for ${period.replace(/([A-Z])/g, " $1").toLowerCase()}`);
        } else {
          setError(res.error || "Failed to load data");
          toast.error(res.error || "Failed to load data");
        }
      } catch (err: any) {
        setError(err.message || "Failed to fetch reports");
        toast.error("Network error while updating reports");
      }
    });
  };

  const handleRefresh = () => {
    startTransition(async () => {
      try {
        const res = await getGesnReports({ period: activePeriod });
        if (res.success && res.data) {
          setData(res.data);
          setError(null);
          toast.success("ACC.GESN.NET data refreshed");
        } else {
          setError(res.error || "Failed to refresh");
          toast.error(res.error || "Failed to refresh data");
        }
      } catch (err: any) {
        setError(err.message || "Failed to refresh");
        toast.error("Error refreshing data");
      }
    });
  };

  // Merge Income & Expenses into a unified transaction list with type tags
  const allTransactions: Array<IGesnTransactionItem & { transType: "income" | "expense" }> = useMemo(() => {
    const list: Array<IGesnTransactionItem & { transType: "income" | "expense" }> = [];
    if (data?.income?.items) {
      data.income.items.forEach((item) => {
        list.push({ ...item, transType: "income" });
      });
    }
    if (data?.expenses?.items) {
      data.expenses.items.forEach((item) => {
        list.push({ ...item, transType: "expense" });
      });
    }

    // Sort descending by date
    list.sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0).getTime();
      const dateB = new Date(b.date || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return list;
  }, [data]);

  // Filter transactions
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter((tx) => {
      // Type filter
      if (transactionTypeFilter !== "all" && tx.transType !== transactionTypeFilter) {
        return false;
      }
      // Category filter
      if (selectedCategory !== "all") {
        const catId = tx.category?._id || "";
        const catName = tx.category?.name?.toLowerCase() || "";
        if (catId !== selectedCategory && catName !== selectedCategory.toLowerCase()) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const desc = (tx.description || "").toLowerCase();
        const cat = (tx.category?.name || "").toLowerCase();
        const ref = (tx.referenceNumber || "").toLowerCase();
        const pay = (tx.paymentMethod || "").toLowerCase();
        const owner = (tx.owner || "").toLowerCase();
        const amt = String(tx.amount);

        return (
          desc.includes(q) ||
          cat.includes(q) ||
          ref.includes(q) ||
          pay.includes(q) ||
          owner.includes(q) ||
          amt.includes(q)
        );
      }
      return true;
    });
  }, [allTransactions, transactionTypeFilter, selectedCategory, searchQuery]);

  // Reset pagination when filters, search, period, or page size change
  useEffect(() => {
    setCurrentPage(1);
    setVisibleCount(pageSize);
  }, [searchQuery, transactionTypeFilter, selectedCategory, activePeriod, pageSize]);

  // IntersectionObserver for lazy loading in infinite scroll mode
  useEffect(() => {
    if (viewMode !== "infinite") return;
    if (visibleCount >= filteredTransactions.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          setTimeout(() => {
            setVisibleCount((prev) => Math.min(prev + pageSize, filteredTransactions.length));
            setIsLoadingMore(false);
          }, 200);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    const sentinel = loadMoreSentinelRef.current;
    if (sentinel) observer.observe(sentinel);

    return () => {
      if (sentinel) observer.unobserve(sentinel);
    };
  }, [viewMode, visibleCount, filteredTransactions.length, pageSize, isLoadingMore]);

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length);

  // Transactions displayed in current mode
  const displayedTransactions = useMemo(() => {
    if (viewMode === "paginated") {
      return filteredTransactions.slice(startIndex, endIndex);
    } else {
      return filteredTransactions.slice(0, visibleCount);
    }
  }, [viewMode, filteredTransactions, startIndex, endIndex, visibleCount]);

  // Dynamic pagination pages calculation (e.g., 1, 2, 3 ... 8)
  const paginationPages = useMemo(() => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);

      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }, [totalPages, currentPage]);

  const categoriesList: IGesnCategorySummary[] = data?.categories || [];

  const summary = data?.summary || {
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMarginPercent: 0,
    incomeCount: 0,
    expenseCount: 0,
  };

  const isNetProfitPositive = summary.netProfit >= 0;

  return (
    <div className="space-y-6">
      {/* Top Banner / Sync Info */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-blue-500/10 border border-emerald-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
            <Building className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-foreground">
                ACC.GESN.NET Live Accounting
              </h2>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync Connected
              </span>
              <span className="px-2 py-0.5 rounded-full text-[11px] font-mono font-medium bg-muted text-muted-foreground border border-border">
                Owner: SHOUROV
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Real-time financial performance, transactions feed, and category breakdown
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isPending}
            className="rounded-xl text-xs font-medium border-border hover:bg-card"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 mr-1.5 text-muted-foreground ${
                isPending ? "animate-spin" : ""
              }`}
            />
            {isPending ? "Updating..." : "Refresh"}
          </Button>

          <a
            href="https://acc.gesn.net/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border transition-colors"
          >
            <span>acc.gesn.net</span>
            <ExternalLink className="w-3 h-3 text-muted-foreground" />
          </a>
        </div>
      </div>

      {/* Error state if API call failed */}
      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleRefresh}
            className="h-7 text-xs"
          >
            Retry Connection
          </Button>
        </div>
      )}

      {/* Period Selector Tabs */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground mr-1 flex-shrink-0 hidden sm:inline-block" />
          {PERIOD_OPTIONS.map((period) => (
            <button
              key={period.value}
              onClick={() => handlePeriodChange(period.value)}
              disabled={isPending}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-all border ${
                activePeriod === period.value
                  ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              {period.label}
            </button>
          ))}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowMonthlyBreakdown(!showMonthlyBreakdown)}
          className="text-xs text-muted-foreground hover:text-foreground flex-shrink-0"
        >
          <BarChart3 className="w-3.5 h-3.5 mr-1" />
          {showMonthlyBreakdown ? "Hide Performance" : "Monthly Trend"}
        </Button>
      </div>

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Income */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Total Income
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-emerald-600 dark:text-emerald-400">
              ৳ {summary.totalIncome.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.incomeCount} transaction{summary.incomeCount === 1 ? "" : "s"} recorded
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Flow Status</span>
            <span className="font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Active Revenue
            </span>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2 relative overflow-hidden group hover:border-rose-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Total Expenses
            </span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-rose-600 dark:text-rose-400">
              ৳ {summary.totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {summary.expenseCount} expenditure{summary.expenseCount === 1 ? "" : "s"} recorded
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Cost Outflow</span>
            <span className="font-semibold text-rose-600">
              {summary.expenseCount > 0 ? "Operational Costs" : "Zero Expenses"}
            </span>
          </div>
        </div>

        {/* Net Profit */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2 relative overflow-hidden group hover:border-blue-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Net Profit
            </span>
            <div
              className={`p-1.5 rounded-lg ${
                isNetProfitPositive
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-rose-500/10 text-rose-600"
              }`}
            >
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div
              className={`text-2xl font-black tracking-tight ${
                isNetProfitPositive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {isNetProfitPositive ? "+" : ""}৳ {summary.netProfit.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Net balance after all operational expenses
            </p>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Result</span>
            <span
              className={`font-semibold ${
                isNetProfitPositive ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {isNetProfitPositive ? "Profitable" : "Deficit"}
            </span>
          </div>
        </div>

        {/* Profit Margin */}
        <div className="p-4 rounded-2xl border border-border bg-card shadow-sm space-y-2 relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
              Profit Margin
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-black tracking-tight text-foreground">
              {summary.profitMarginPercent.toFixed(1)}%
            </div>
            <div className="w-full bg-muted rounded-full h-1.5 mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  summary.profitMarginPercent > 50
                    ? "bg-emerald-500"
                    : summary.profitMarginPercent > 20
                    ? "bg-blue-500"
                    : "bg-amber-500"
                }`}
                style={{
                  width: `${Math.min(Math.max(summary.profitMarginPercent, 0), 100)}%`,
                }}
              />
            </div>
          </div>
          <div className="pt-2 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>Retention Rate</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400">
              {summary.profitMarginPercent >= 50
                ? "High Margin"
                : summary.profitMarginPercent > 0
                ? "Healthy Margin"
                : "Loss"}
            </span>
          </div>
        </div>
      </div>

      {/* Collapsible Monthly Performance View */}
      {showMonthlyBreakdown && data?.monthlyPerformance?.monthlyData && (
        <div className="p-5 rounded-2xl border border-border bg-card/60 backdrop-blur space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-emerald-600" />
                Year {data.monthlyPerformance.year} Monthly Financial Performance
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Yearly Total: ৳ {data.monthlyPerformance.yearlyTotal.income.toLocaleString()} Income /{" "}
                ৳ {data.monthlyPerformance.yearlyTotal.expenses.toLocaleString()} Expenses (Net Profit: ৳{" "}
                {data.monthlyPerformance.yearlyTotal.profit.toLocaleString()})
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMonthlyBreakdown(false)}
              className="h-7 text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
            {data.monthlyPerformance.monthlyData.map((m) => {
              const hasActivity = m.totalIncome > 0 || m.totalExpenses > 0;
              return (
                <div
                  key={m.month}
                  className={`p-3 rounded-xl border text-xs space-y-1.5 transition-all ${
                    hasActivity
                      ? "bg-card border-border/80 hover:border-emerald-500/40"
                      : "bg-muted/30 border-transparent opacity-60"
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-foreground">
                    <span>{m.monthName.slice(0, 3)}</span>
                    {hasActivity && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          m.profit >= 0
                            ? "bg-emerald-500/10 text-emerald-600"
                            : "bg-rose-500/10 text-rose-600"
                        }`}
                      >
                        {m.profitPercent.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between text-emerald-600">
                      <span>Inc:</span>
                      <span className="font-semibold">৳{m.totalIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-rose-600">
                      <span>Exp:</span>
                      <span className="font-semibold">৳{m.totalExpenses.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-bold text-foreground pt-1 border-t border-border/50">
                      <span>Net:</span>
                      <span className={m.profit >= 0 ? "text-emerald-600" : "text-rose-600"}>
                        ৳{m.profit.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Category Pills Breakdown */}
      {categoriesList.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" />
              Category Breakdown (Click to filter)
            </span>
            {selectedCategory !== "all" && (
              <button
                onClick={() => setSelectedCategory("all")}
                className="text-xs text-emerald-600 hover:underline flex items-center gap-1 font-medium"
              >
                Clear Category Filter
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory("all")}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all border flex items-center gap-1.5 ${
                selectedCategory === "all"
                  ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm"
                  : "bg-card text-muted-foreground border-border hover:bg-muted"
              }`}
            >
              All Categories ({categoriesList.length})
            </button>

            {categoriesList
              .filter((c) => c.total > 0 || c.count > 0)
              .map((c) => {
                const isSelected =
                  selectedCategory === c.category._id ||
                  selectedCategory.toLowerCase() === c.category.name.toLowerCase();
                const color = c.category.color || (c.category.type === "Income" ? "#10b981" : "#ef4444");

                return (
                  <button
                    key={c.category._id}
                    onClick={() =>
                      setSelectedCategory(isSelected ? "all" : c.category.name)
                    }
                    className={`px-3 py-1.5 rounded-xl text-xs flex items-center gap-2 transition-all border ${
                      isSelected
                        ? "bg-emerald-600 text-white border-emerald-600 shadow-sm font-semibold"
                        : "bg-card text-foreground border-border hover:bg-muted/80"
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color }}
                    />
                    <span>{c.category.name}</span>
                    <span
                      className={`text-[11px] px-1.5 py-0.5 rounded-full ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      ৳{c.total.toLocaleString()} ({c.count})
                    </span>
                  </button>
                );
              })}
          </div>
        </div>
      )}

      {/* Transactions Section */}
      <div className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-extrabold text-foreground flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Live Accounting Transactions
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium border border-border">
              {filteredTransactions.length} total
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {/* View Mode Switcher (Pagination vs Infinite Lazy Scroll) */}
            <div className="flex items-center bg-card border border-border rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode("paginated")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "paginated"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Pages
              </button>
              <button
                onClick={() => setViewMode("infinite")}
                className={`px-2.5 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "infinite"
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Lazy Scroll
              </button>
            </div>

            {/* Type Filter Buttons */}
            <div className="flex items-center gap-1">
              <button
                onClick={() => setTransactionTypeFilter("all")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium transition-all border ${
                  transactionTypeFilter === "all"
                    ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setTransactionTypeFilter("income")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors border ${
                  transactionTypeFilter === "income"
                    ? "bg-emerald-600 text-white border-emerald-600 font-semibold shadow-sm"
                    : "bg-card text-emerald-600 dark:text-emerald-400 border-border hover:bg-muted"
                }`}
              >
                <ArrowDownLeft className="w-3 h-3" />
                Income ({data?.income?.count || 0})
              </button>
              <button
                onClick={() => setTransactionTypeFilter("expense")}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors border ${
                  transactionTypeFilter === "expense"
                    ? "bg-rose-600 text-white border-rose-600 font-semibold shadow-sm"
                    : "bg-card text-rose-600 dark:text-rose-400 border-border hover:bg-muted"
                }`}
              >
                <ArrowUpRight className="w-3 h-3" />
                Expenses ({data?.expenses?.count || 0})
              </button>
            </div>
          </div>
        </div>

        {/* Search & Page Size Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions by description, category, payment method, reference, owner..."
              className="pl-9 rounded-xl bg-card"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Page Size Selector */}
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground self-end sm:self-auto">
            <span className="hidden sm:inline">Per page:</span>
            {PAGE_SIZE_OPTIONS.map((sz) => (
              <button
                key={sz}
                onClick={() => {
                  setPageSize(sz);
                  setCurrentPage(1);
                  setVisibleCount(sz);
                }}
                className={`px-2.5 py-1.5 rounded-xl border text-xs font-medium transition-all ${
                  pageSize === sz
                    ? "bg-emerald-600 text-white border-emerald-600 font-bold shadow-sm"
                    : "bg-card text-muted-foreground border-border hover:bg-muted"
                }`}
              >
                {sz}
              </button>
            ))}
          </div>
        </div>

        {/* Range Information */}
        {filteredTransactions.length > 0 && (
          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>
              {viewMode === "paginated" ? (
                <>
                  Showing <strong className="text-foreground">{startIndex + 1}</strong> to{" "}
                  <strong className="text-foreground">{endIndex}</strong> of{" "}
                  <strong className="text-foreground">{filteredTransactions.length}</strong> transactions
                </>
              ) : (
                <>
                  Showing <strong className="text-foreground">{displayedTransactions.length}</strong> of{" "}
                  <strong className="text-foreground">{filteredTransactions.length}</strong> loaded
                </>
              )}
            </span>

            {viewMode === "paginated" && totalPages > 1 && (
              <span>
                Page <strong className="text-foreground">{currentPage}</strong> of{" "}
                <strong className="text-foreground">{totalPages}</strong>
              </span>
            )}
          </div>
        )}

        {/* Transactions List */}
        <div className="space-y-2.5">
          {isPending ? (
            /* Loading Skeleton Rows */
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={i}
                className="p-4 rounded-2xl border border-border bg-card/60 animate-pulse flex items-center justify-between gap-4"
              >
                <div className="flex items-center gap-3">
                  <Skeleton className="w-9 h-9 rounded-xl flex-shrink-0" />
                  <div className="space-y-2">
                    <Skeleton className="w-24 h-4 rounded-full" />
                    <Skeleton className="w-44 h-4 rounded" />
                    <Skeleton className="w-20 h-3 rounded" />
                  </div>
                </div>
                <div className="space-y-1 text-right">
                  <Skeleton className="w-20 h-6 rounded ml-auto" />
                  <Skeleton className="w-14 h-3 rounded ml-auto" />
                </div>
              </div>
            ))
          ) : filteredTransactions.length === 0 ? (
            <div className="p-10 text-center rounded-2xl border border-dashed border-border bg-card">
              <Receipt className="w-10 h-10 mx-auto text-muted-foreground/40 mb-2" />
              <p className="text-sm font-semibold text-foreground">
                No transactions match the selected filters
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Try selecting a different period, clearing category filters, or searching for other keywords.
              </p>
              {(searchQuery || selectedCategory !== "all" || transactionTypeFilter !== "all") && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setSelectedCategory("all");
                    setTransactionTypeFilter("all");
                  }}
                  className="mt-4 rounded-xl text-xs"
                >
                  Reset All Filters
                </Button>
              )}
            </div>
          ) : (
            displayedTransactions.map((tx) => {
              const isIncome = tx.transType === "income";
              const formattedDate = tx.date
                ? new Date(tx.date).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })
                : "No date";

              const categoryColor =
                tx.category?.color || (isIncome ? "#10b981" : "#3b82f6");

              return (
                <div
                  key={tx._id}
                  className="p-4 rounded-2xl border border-border bg-card hover:border-emerald-500/40 transition-all shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start gap-3 min-w-0">
                    {/* Icon */}
                    <div
                      className={`p-2.5 rounded-xl flex-shrink-0 mt-0.5 ${
                        isIncome
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {isIncome ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                    </div>

                    <div className="space-y-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        {/* Category Badge */}
                        <span
                          className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider inline-flex items-center gap-1.5"
                          style={{
                            backgroundColor: `${categoryColor}18`,
                            color: categoryColor,
                            borderColor: `${categoryColor}40`,
                            borderWidth: 1,
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: categoryColor }}
                          />
                          {tx.category?.name || (isIncome ? "Income" : "Expense")}
                        </span>

                        {/* Payment Method Tag */}
                        {tx.paymentMethod && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground flex items-center gap-1 font-medium border border-border/60">
                            <CreditCard className="w-3 h-3" />
                            {tx.paymentMethod}
                          </span>
                        )}

                        {/* Reference Number */}
                        {tx.referenceNumber && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted text-muted-foreground border border-border/60">
                            Ref: {tx.referenceNumber}
                          </span>
                        )}

                        {/* Owner / Recorder */}
                        {tx.owner && (
                          <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-muted/60 text-muted-foreground border border-border/40">
                            By: {tx.owner}
                          </span>
                        )}
                      </div>

                      {/* Description / Title */}
                      <p className="text-sm font-semibold text-foreground break-words group-hover:text-emerald-600 transition-colors">
                        {tx.description || tx.category?.name || (isIncome ? "Revenue Entry" : "Expense Entry")}
                      </p>

                      {/* Date */}
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formattedDate}
                      </p>
                    </div>
                  </div>

                  {/* Amount */}
                  <div className="text-left sm:text-right flex-shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/50">
                    <span
                      className={`text-lg font-extrabold tracking-tight ${
                        isIncome
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {isIncome ? "+" : "-"} ৳ {tx.amount.toLocaleString()}
                    </span>
                    <span className="block text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
                      {isIncome ? "Credit (Inflow)" : "Debit (Outflow)"}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* PAGINATION CONTROLS (When in paginated viewMode) */}
        {viewMode === "paginated" && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-3 border-t border-border">
            <div className="text-xs text-muted-foreground">
              Showing {startIndex + 1}–{endIndex} of {filteredTransactions.length} transactions
            </div>

            <div className="flex items-center gap-1.5">
              {/* First Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-xl"
                title="First Page"
              >
                <ChevronsLeft className="w-4 h-4" />
              </Button>

              {/* Prev Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5 rounded-xl text-xs"
              >
                <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                Prev
              </Button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {paginationPages.map((pageItem, idx) => {
                  if (pageItem === "...") {
                    return (
                      <span
                        key={`ellipsis-${idx}`}
                        className="px-2 text-xs text-muted-foreground"
                      >
                        ...
                      </span>
                    );
                  }
                  const pageNum = Number(pageItem);
                  const isCurrent = pageNum === currentPage;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`h-8 w-8 rounded-xl text-xs font-semibold transition-all border ${
                        isCurrent
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                          : "bg-card text-muted-foreground border-border hover:bg-muted"
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              {/* Next Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5 rounded-xl text-xs"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>

              {/* Last Page */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-xl"
                title="Last Page"
              >
                <ChevronsRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}

        {/* INFINITE SCROLL / LAZY LOAD SENTINEL & LOAD MORE BUTTON */}
        {viewMode === "infinite" && filteredTransactions.length > 0 && (
          <div className="pt-2 text-center">
            {visibleCount < filteredTransactions.length ? (
              <div className="space-y-3">
                {/* Sentinel for IntersectionObserver */}
                <div ref={loadMoreSentinelRef} className="h-6 w-full" />

                {isLoadingMore ? (
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-muted text-muted-foreground border border-border">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Lazy loading more transactions...
                  </div>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() =>
                      setVisibleCount((prev) =>
                        Math.min(prev + pageSize, filteredTransactions.length)
                      )
                    }
                    className="rounded-xl text-xs border-border hover:bg-card shadow-sm"
                  >
                    Load More Transactions (+{pageSize})
                  </Button>
                )}

                <div className="w-full max-w-xs mx-auto bg-muted rounded-full h-1 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full transition-all"
                    style={{
                      width: `${(displayedTransactions.length / filteredTransactions.length) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground py-2 border-t border-border">
                All {filteredTransactions.length} transactions loaded
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
