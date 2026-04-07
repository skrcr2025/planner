"use client";

import { useState, useEffect, useCallback } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
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

export default function ReportsPage() {
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
    setMonth((m) => format(subMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }
  function nextMonth() {
    setMonth((m) => format(addMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Reports</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="w-28 text-center font-medium text-slate-700">
            {format(parseISO(month + "-01"), "MMM yyyy")}
          </span>
          <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">Loading…</div>
      ) : !data ? (
        <p className="text-center py-20 text-slate-400">Failed to load data</p>
      ) : (
        <div className="space-y-6">
          {/* Income vs Expenses trend */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Income vs Expenses (6 months)</h2>
            {data.trend.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.trend} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => format(parseISO(v + "-01"), "MMM")}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    labelFormatter={(l) => format(parseISO(String(l) + "-01"), "MMMM yyyy")}
                  />
                  <Legend />
                  <Bar dataKey="total_income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Net balance line chart */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h2 className="font-semibold text-slate-700 mb-4">Net Balance Trend</h2>
            {data.trend.length === 0 ? (
              <p className="text-sm text-slate-400 py-8 text-center">No data available</p>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => format(parseISO(v + "-01"), "MMM")}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                  <Tooltip
                    formatter={(v) => fmt(Number(v))}
                    labelFormatter={(l) => format(parseISO(String(l) + "-01"), "MMMM yyyy")}
                  />
                  <Line
                    type="monotone"
                    dataKey="balance"
                    name="Balance"
                    stroke="#6366f1"
                    strokeWidth={2.5}
                    dot={{ r: 4, fill: "#6366f1" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Expense breakdown pie */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Expense Breakdown</h2>
              {data.categorySummaries.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No expenses recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <PieChart>
                    <Pie
                      data={data.categorySummaries}
                      dataKey="total"
                      nameKey="category_name"
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      label={({ name, percent }) =>
                        `${name} ${(((percent as number) ?? 0) * 100).toFixed(0)}%`
                      }
                      labelLine={false}
                    >
                      {data.categorySummaries.map((entry, i) => (
                        <Cell key={i} fill={entry.category_color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Category bar chart */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
              <h2 className="font-semibold text-slate-700 mb-4">Top Categories</h2>
              {data.categorySummaries.length === 0 ? (
                <p className="text-sm text-slate-400 py-8 text-center">No expenses recorded</p>
              ) : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={data.categorySummaries.slice(0, 8)}
                    layout="vertical"
                    margin={{ left: 10 }}
                  >
                    <XAxis type="number" tick={{ fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                    <YAxis
                      type="category"
                      dataKey="category_name"
                      tick={{ fontSize: 12 }}
                      width={90}
                    />
                    <Tooltip formatter={(v) => fmt(Number(v))} />
                    <Bar dataKey="total" name="Spent" radius={[0, 4, 4, 0]}>
                      {data.categorySummaries.slice(0, 8).map((entry, i) => (
                        <Cell key={i} fill={entry.category_color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Category table */}
          {data.categorySummaries.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h2 className="font-semibold text-slate-700">Category Details</h2>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-5 py-3 text-slate-500 font-medium">Category</th>
                    <th className="text-right px-5 py-3 text-slate-500 font-medium">Spent</th>
                    <th className="text-right px-5 py-3 text-slate-500 font-medium">Budget</th>
                    <th className="text-right px-5 py-3 text-slate-500 font-medium">% of Total</th>
                  </tr>
                </thead>
                <tbody>
                  {data.categorySummaries.map((c) => {
                    const pct = data.summary.total_expense > 0
                      ? (c.total / data.summary.total_expense) * 100
                      : 0;
                    return (
                      <tr key={c.category_id} className="border-b border-slate-50 hover:bg-slate-50">
                        <td className="px-5 py-3">
                          <span className="flex items-center gap-2">
                            <span
                              className="w-3 h-3 rounded-full shrink-0"
                              style={{ backgroundColor: c.category_color }}
                            />
                            {c.category_icon} {c.category_name}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-right font-medium text-red-600">
                          {fmt(c.total)}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {c.budget !== undefined ? fmt(c.budget) : "—"}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {pct.toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
