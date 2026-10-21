"use client";

import { useState, useEffect, useCallback } from "react";
import {
  getUnifiedFinancialWorkspaceData,
  UnifiedFinancialItem,
  UnifiedFinancialSummary,
} from "@/lib/actions/lifeUnifiedFinance.actions";
import { FinanceSummaryCards } from "./FinanceSummaryCards";
import { FinanceRecordList } from "./FinanceRecordList";
import { SmartAddRecordModal } from "./SmartAddRecordModal";
import { FinanceRecordDetailModal } from "./FinanceRecordDetailModal";
import { ILifePerson } from "@/types";

interface FinanceWorkspaceProps {
  initialFilter?: string;
  initialSubFilter?: string;
  peopleList: ILifePerson[];
  currencySymbol?: string;
}

export function FinanceWorkspace({
  initialFilter = "all",
  initialSubFilter,
  peopleList,
  currencySymbol = "৳",
}: FinanceWorkspaceProps) {
  const [filter, setFilter] = useState(initialFilter);
  const [subFilter, setSubFilter] = useState<string | undefined>(initialSubFilter);
  const [searchQuery, setSearchQuery] = useState("");
  const [personId, setPersonId] = useState("all");
  const [privacyFilter, setPrivacyFilter] = useState<"all" | "private" | "shared">("all");

  const [records, setRecords] = useState<UnifiedFinancialItem[]>([]);
  const [summary, setSummary] = useState<UnifiedFinancialSummary>({
    filter: "all",
    card1: { label: "Monthly Income", value: 0 },
    card2: { label: "Monthly Expenses", value: 0 },
    card3: { label: "Loans Receivable", value: 0 },
    card4: { label: "Loans Payable", value: 0 },
  });
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal State
  const [selectedRecord, setSelectedRecord] = useState<UnifiedFinancialItem | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getUnifiedFinancialWorkspaceData({
        filter,
        subFilter,
        search: searchQuery,
        personId: personId !== "all" ? personId : undefined,
        privacy: privacyFilter,
      });
      setRecords(res.records);
      setSummary(res.summary);
    } catch (err) {
      console.error("Error loading financial workspace data:", err);
    } finally {
      setIsLoading(false);
    }
  }, [filter, subFilter, searchQuery, personId, privacyFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (newFilter: string, newSubFilter?: string) => {
    setFilter(newFilter);
    setSubFilter(newSubFilter);
  };

  return (
    <div className="space-y-3.5">
      {/* 1. Contextual Financial Summaries */}
      <FinanceSummaryCards summary={summary} currencySymbol={currencySymbol} />

      {/* 2. Unified Financial Record List with Filters & Search */}
      <FinanceRecordList
        records={records}
        activeFilter={filter}
        activeSubFilter={subFilter}
        onFilterChange={handleFilterChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        peopleList={peopleList}
        selectedPersonId={personId}
        onPersonFilterChange={setPersonId}
        privacyFilter={privacyFilter}
        onPrivacyFilterChange={setPrivacyFilter}
        onSelectRecord={(rec) => setSelectedRecord(rec)}
        currencySymbol={currencySymbol}
      />

      {/* 3. One Smart + Add Record Button */}
      <SmartAddRecordModal
        activeFilter={filter}
        peopleList={peopleList}
        onRecordCreated={loadData}
        currencySymbol={currencySymbol}
      />

      {/* 4. Record Details Modal (Repay, Forgive, Sharing ACL, History) */}
      {selectedRecord && (
        <FinanceRecordDetailModal
          item={selectedRecord}
          onClose={() => setSelectedRecord(null)}
          peopleList={peopleList}
          onRecordUpdated={loadData}
          currencySymbol={currencySymbol}
        />
      )}
    </div>
  );
}
