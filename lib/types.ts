export type TransactionType = "income" | "expense";

export interface Category {
  id: number;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: number;
  date: string; // ISO date string YYYY-MM-DD
  amount: number;
  description: string;
  category_id: number;
  type: TransactionType;
  notes: string;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
}

export interface Budget {
  id: number;
  category_id: number;
  month: string; // YYYY-MM
  amount: number;
  category_name?: string;
  category_color?: string;
  category_icon?: string;
  spent?: number;
}

export interface MonthlySummary {
  month: string;
  total_income: number;
  total_expense: number;
  balance: number;
}

export interface CategorySummary {
  category_id: number;
  category_name: string;
  category_color: string;
  category_icon: string;
  total: number;
  budget?: number;
}
