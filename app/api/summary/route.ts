import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { MonthlySummary, CategorySummary } from "@/lib/types";

export function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month") ?? new Date().toISOString().slice(0, 7);

    // Monthly totals
    const totals = db
      .prepare(
        `SELECT
           COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
           COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense
         FROM transactions
         WHERE strftime('%Y-%m', date) = ?`
      )
      .get(month) as { total_income: number; total_expense: number };

    const summary: MonthlySummary = {
      month,
      total_income: totals.total_income,
      total_expense: totals.total_expense,
      balance: totals.total_income - totals.total_expense,
    };

    // Expense breakdown by category
    const expenseByCategory = db
      .prepare(
        `SELECT t.category_id, c.name AS category_name, c.color AS category_color,
                c.icon AS category_icon, SUM(t.amount) AS total
         FROM transactions t JOIN categories c ON t.category_id = c.id
         WHERE t.type = 'expense' AND strftime('%Y-%m', t.date) = ?
         GROUP BY t.category_id
         ORDER BY total DESC`
      )
      .all(month) as CategorySummary[];

    // Attach budget amounts if set
    const budgetMap = new Map<number, number>();
    const budgetRows = db
      .prepare("SELECT category_id, amount FROM budgets WHERE month = ?")
      .all(month) as { category_id: number; amount: number }[];
    budgetRows.forEach((b) => budgetMap.set(b.category_id, b.amount));

    const categorySummaries = expenseByCategory.map((c) => ({
      ...c,
      budget: budgetMap.get(c.category_id),
    }));

    // Last 6 months trend
    const trend = db
      .prepare(
        `SELECT strftime('%Y-%m', date) AS month,
                COALESCE(SUM(CASE WHEN type='income'  THEN amount ELSE 0 END), 0) AS total_income,
                COALESCE(SUM(CASE WHEN type='expense' THEN amount ELSE 0 END), 0) AS total_expense
         FROM transactions
         WHERE date >= date(?, '-5 months', 'start of month')
         GROUP BY strftime('%Y-%m', date)
         ORDER BY month`
      )
      .all(month + "-01") as MonthlySummary[];

    const trendWithBalance = trend.map((t) => ({
      ...t,
      balance: t.total_income - t.total_expense,
    }));

    return Response.json({ summary, categorySummaries, trend: trendWithBalance });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}
