export type TxType = "income" | "expense";
export type TxSource = "UPI" | "Bank Transfer" | "Card";

export interface Tx {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  amount: number;
  type: TxType;
  category: string;
  source: TxSource;
}

export interface EMI {
  id: string;
  name: string;
  lender: string;
  principal: number;
  annualRate: number;
  tenureMonths: number;
  emi: number;
  monthsRemaining: number;
}

export interface Goal {
  id: string;
  name: string;
  target: number;
  saved: number;
  targetDate: string; // YYYY-MM
}

export interface Budget {
  category: string;
  limit: number;
}

export interface Customer {
  id: string;
  name: string;
  totalSpent: number;
  visits: number;
  lastVisitDaysAgo: number;
}

export interface Campaign {
  id: string;
  segment: string;
  reach: number;
  discount: number;
  message: string;
  createdAt: string;
}

export type Severity = "good" | "warn" | "bad" | "info";

export interface Insight {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
}

export interface BudgetStatus {
  category: string;
  spent: number;
  limit: number;
  pct: number;
  state: "ok" | "warn" | "over";
}

export interface Alert {
  id: string;
  kind: "critical" | "warning";
  category: string;
  pct: number;
  message: string;
}
