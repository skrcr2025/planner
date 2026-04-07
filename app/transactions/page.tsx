"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Pencil, Trash2, ChevronLeft, ChevronRight, Search } from "lucide-react";
import TransactionForm from "@/components/TransactionForm";
import type { Transaction, Category } from "@/lib/types";
import { format, addMonths, subMonths, parseISO, startOfMonth } from "date-fns";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(n);
}

export default function TransactionsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string>("");
  const [filterCategory, setFilterCategory] = useState<string>("");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ month });
    if (filterType) params.set("type", filterType);
    if (filterCategory) params.set("category_id", filterCategory);
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) setTransactions(await res.json());
    setLoading(false);
  }, [month, filterType, filterCategory]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  function prevMonth() {
    setMonth((m) => format(subMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }
  function nextMonth() {
    setMonth((m) => format(addMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }

  async function handleDelete(id: number) {
    await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    setDeleteId(null);
    load();
  }

  const filtered = transactions.filter(
    (t) =>
      !search ||
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (t.category_name ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalIncome = filtered
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + t.amount, 0);
  const totalExpense = filtered
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + t.amount, 0);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Transactions</h1>
        <button
          onClick={() => { setEditing(null); setShowForm(true); }}
          className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          <Plus className="w-4 h-4" /> Add Transaction
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-1">
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

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-1.5 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.icon} {c.name}
            </option>
          ))}
        </select>

        <div className="relative flex-1 min-w-40">
          <Search className="w-4 h-4 absolute left-2.5 top-2 text-slate-400" />
          <input
            type="text"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Totals */}
      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="bg-green-50 rounded-lg px-4 py-2 flex justify-between">
          <span className="text-slate-600">Income</span>
          <span className="font-semibold text-green-600">{fmt(totalIncome)}</span>
        </div>
        <div className="bg-red-50 rounded-lg px-4 py-2 flex justify-between">
          <span className="text-slate-600">Expenses</span>
          <span className="font-semibold text-red-600">{fmt(totalExpense)}</span>
        </div>
        <div className="bg-indigo-50 rounded-lg px-4 py-2 flex justify-between">
          <span className="text-slate-600">Balance</span>
          <span className={`font-semibold ${totalIncome - totalExpense >= 0 ? "text-indigo-600" : "text-red-600"}`}>
            {fmt(totalIncome - totalExpense)}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading…</p>
        ) : filtered.length === 0 ? (
          <p className="text-center py-12 text-slate-400">No transactions found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Date</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Description</th>
                <th className="text-left px-4 py-3 text-slate-500 font-medium">Category</th>
                <th className="text-right px-4 py-3 text-slate-500 font-medium">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((t) => (
                <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">
                    {format(parseISO(t.date), "MMM d, yyyy")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-slate-800">{t.description}</div>
                    {t.notes && <div className="text-xs text-slate-400">{t.notes}</div>}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: (t.category_color ?? "#6366f1") + "20",
                        color: t.category_color ?? "#6366f1",
                      }}
                    >
                      {t.category_icon} {t.category_name}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right font-semibold whitespace-nowrap ${t.type === "income" ? "text-green-600" : "text-red-600"}`}>
                    {t.type === "income" ? "+" : "-"}{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 justify-end">
                      <button
                        onClick={() => { setEditing(t); setShowForm(true); }}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteId(t.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showForm && (
        <Modal title={editing ? "Edit Transaction" : "Add Transaction"} onClose={() => setShowForm(false)}>
          <TransactionForm
            transaction={editing}
            onSave={() => { setShowForm(false); load(); }}
            onCancel={() => setShowForm(false)}
          />
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteId !== null && (
        <Modal title="Delete Transaction" onClose={() => setDeleteId(null)}>
          <p className="text-slate-600 mb-6">Are you sure you want to delete this transaction?</p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setDeleteId(null)}
              className="px-4 py-2 text-sm border border-slate-200 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={() => handleDelete(deleteId)}
              className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        {children}
      </div>
    </div>
  );
}
