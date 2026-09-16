export interface IGesnCategory {
  _id: string;
  name: string;
  type: "Income" | "Expense";
  color?: string;
  active?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGesnTransactionItem {
  _id: string;
  amount: number;
  date: string;
  paymentMethod?: string;
  description?: string;
  referenceNumber?: string;
  owner?: string;
  category?: IGesnCategory;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGesnReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  profitMarginPercent: number;
  incomeCount: number;
  expenseCount: number;
}

export interface IGesnCategorySummary {
  category: IGesnCategory;
  total: number;
  count: number;
}

export interface IGesnMonthlyData {
  month: number;
  monthName: string;
  totalIncome: number;
  totalExpenses: number;
  profit: number;
  profitPercent: number;
}

export interface IGesnMonthlyPerformance {
  year: number;
  monthlyData: IGesnMonthlyData[];
  yearlyTotal: {
    income: number;
    expenses: number;
    profit: number;
  };
}

export interface IGesnReportsData {
  summary: IGesnReportSummary;
  income: {
    total: number;
    count: number;
    items: IGesnTransactionItem[];
  };
  expenses: {
    total: number;
    count: number;
    items: IGesnTransactionItem[];
  };
  profit: {
    totalIncome: number;
    totalExpenses: number;
    netProfit: number;
  };
  categories: IGesnCategorySummary[];
  monthlyPerformance: IGesnMonthlyPerformance;
}

export interface IGesnReportsResponse {
  success: boolean;
  timestamp?: string;
  owner?: string;
  filters?: {
    period?: string;
    startDate?: string;
    endDate?: string;
    category?: string | null;
    type?: string;
    year?: number;
  };
  data?: IGesnReportsData;
  error?: string;
}
