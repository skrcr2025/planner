"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import type { MonthlySummary, CategorySummary } from "@/lib/types";
import { format, addMonths, subMonths, parseISO, startOfMonth } from "date-fns";

interface SummaryData {
  summary: MonthlySummary;
  categorySummaries: CategorySummary[];
  trend: MonthlySummary[];
}

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

function formatMonth(ym: string) {
  return format(parseISO(ym + "-01"), "MMM yyyy");
}

export default function DashboardPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<SummaryData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/summary?month=${month}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  function prevMonth() {
    setMonth((m) =>
      format(subMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM")
    );
  }
  function nextMonth() {
    setMonth((m) =>
      format(addMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM")
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={prevMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="w-28 text-center font-medium text-slate-700">
            {formatMonth(month)}
          </span>
          <button
            onClick={nextMonth}
            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : data ? (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            <SummaryCard
              label="Total Income"
              value={fmt(data.summary.total_income)}
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
              color="green"
            />
            <SummaryCard
              label="Total Expenses"
              value={fmt(data.summary.total_expense)}
              icon={<TrendingDown className="w-5 h-5 text-red-500" />}
              color="red"
            />
            <SummaryCard
              label="Net Balance"
              value={fmt(data.summary.balance)}
              icon={<Wallet className="w-5 h-5 text-indigo-500" />}
              color={data.summary.balance >= 0 ? "indigo" : "red"}
            />
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* 6-month trend */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-700 mb-4">6-Month Trend</h2>
              {data.trend.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No data yet</p>
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={data.trend} barGap={2}>
                    <XAxis
                      dataKey="month"
                      tickFormatter={(v) => format(parseISO(v + "-01"), "MMM")}
                      tick={{ fontSize: 12 }}
                    />
                    <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <Tooltip
                      formatter={(v) => fmt(Number(v))}
                      labelFormatter={(l) => formatMonth(String(l))}
                    />
                    <Bar dataKey="total_income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="total_expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category breakdown */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Expenses by Category</h2>
              {data.categorySummaries.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No expenses recorded</p>
              ) : (
                <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
                  {data.categorySummaries.map((c) => (
                    <CategoryRow key={c.category_id} item={c} totalExpense={data.summary.total_expense} />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Budget progress */}
          {data.categorySummaries.some((c) => c.budget !== undefined) && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Budget Progress</h2>
              <div className="space-y-4">
                {data.categorySummaries
                  .filter((c) => c.budget !== undefined)
                  .map((c) => {
                    const pct = Math.min(100, (c.total / (c.budget ?? 1)) * 100);
                    const over = c.total > (c.budget ?? 0);
                    return (
                      <div key={c.category_id}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium text-slate-700">
                            {c.category_icon} {c.category_name}
                          </span>
                          <span className={over ? "text-red-600 font-semibold" : "text-slate-600"}>
                            {fmt(c.total)} / {fmt(c.budget!)}
                          </span>
                        </div>
                        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-indigo-500"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </>
      ) : (
        <p className="text-center text-slate-400 py-20">Failed to load data</p>
      )}
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}) {
  const bg: Record<string, string> = {
    green: "bg-green-50",
    red: "bg-red-50",
    indigo: "bg-indigo-50",
  };
  return (
    <div className={`${bg[color] ?? "bg-slate-50"} rounded-xl p-5 flex items-start justify-between`}>
      <div>
        <p className="text-sm text-slate-500 mb-1">{label}</p>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
      </div>
      <div className="p-2 bg-white rounded-lg shadow-sm">{icon}</div>
    </div>
  );
}

function CategoryRow({
  item,
  totalExpense,
}: {
  item: CategorySummary;
  totalExpense: number;
}) {
  const pct = totalExpense > 0 ? (item.total / totalExpense) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="flex items-center gap-1.5 text-slate-700">
          <span>{item.category_icon}</span>
          <span>{item.category_name}</span>
        </span>
        <span className="font-medium text-slate-900">
          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(item.total)}
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, backgroundColor: item.category_color }}
        />
      </div>
    </div>
  );
}
