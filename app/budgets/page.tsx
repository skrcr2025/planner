"use client";

import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus, Pencil } from "lucide-react";
import type { Budget, Category } from "@/lib/types";
import { format, addMonths, subMonths, parseISO, startOfMonth } from "date-fns";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function BudgetsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editBudget, setEditBudget] = useState<{ categoryId: number; amount: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Expense categories not yet budgeted
  const [showAdd, setShowAdd] = useState(false);
  const [newCatId, setNewCatId] = useState("");
  const [newAmount, setNewAmount] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/budgets?month=${month}`);
    if (res.ok) setBudgets(await res.json());
    setLoading(false);
  }, [month]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data: Category[]) => {
        setCategories(data.filter((c) => c.type === "expense"));
      });
  }, []);

  function prevMonth() {
    setMonth((m) => format(subMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }
  function nextMonth() {
    setMonth((m) => format(addMonths(startOfMonth(parseISO(m + "-01")), 1), "yyyy-MM"));
  }

  async function saveBudget(categoryId: number, amount: number) {
    setSaving(true);
    setFormError("");
    try {
      const res = await fetch("/api/budgets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category_id: categoryId, month, amount }),
      });
      if (!res.ok) {
        setFormError(await res.text());
        return;
      }
      setEditBudget(null);
      setShowAdd(false);
      setNewCatId("");
      setNewAmount("");
      load();
    } finally {
      setSaving(false);
    }
  }

  async function handleEditSave() {
    if (!editBudget) return;
    const amount = parseFloat(editBudget.amount);
    if (isNaN(amount) || amount < 0) {
      setFormError("Amount must be zero or greater");
      return;
    }
    await saveBudget(editBudget.categoryId, amount);
  }

  async function handleAddSave() {
    if (!newCatId) { setFormError("Select a category"); return; }
    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) { setFormError("Enter a valid amount"); return; }
    await saveBudget(Number(newCatId), amount);
  }

  const budgetedIds = new Set(budgets.map((b) => b.category_id));
  const unbudgetedCategories = categories.filter((c) => !budgetedIds.has(c.id));

  const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
  const totalSpent = budgets.reduce((s, b) => s + (b.spent ?? 0), 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Budgets</h1>
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

      {/* Overview */}
      {budgets.length > 0 && (
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="bg-indigo-50 rounded-lg px-4 py-3">
            <p className="text-slate-500 mb-0.5">Total Budget</p>
            <p className="font-bold text-slate-900 text-lg">{fmt(totalBudget)}</p>
          </div>
          <div className="bg-red-50 rounded-lg px-4 py-3">
            <p className="text-slate-500 mb-0.5">Total Spent</p>
            <p className="font-bold text-slate-900 text-lg">{fmt(totalSpent)}</p>
          </div>
          <div className={`${totalBudget - totalSpent >= 0 ? "bg-green-50" : "bg-red-50"} rounded-lg px-4 py-3`}>
            <p className="text-slate-500 mb-0.5">Remaining</p>
            <p className={`font-bold text-lg ${totalBudget - totalSpent >= 0 ? "text-green-600" : "text-red-600"}`}>
              {fmt(totalBudget - totalSpent)}
            </p>
          </div>
        </div>
      )}

      {/* Budget list */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-100">
        {loading ? (
          <p className="text-center py-12 text-slate-400">Loading…</p>
        ) : (
          <div className="divide-y divide-slate-50">
            {budgets.length === 0 && (
              <p className="text-center py-12 text-slate-400">No budgets set for this month</p>
            )}
            {budgets.map((b) => {
              const spent = b.spent ?? 0;
              const pct = Math.min(100, b.amount > 0 ? (spent / b.amount) * 100 : 0);
              const over = spent > b.amount;
              const isEditing = editBudget?.categoryId === b.category_id;

              return (
                <div key={b.id} className="px-5 py-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-slate-800">
                      {b.category_icon} {b.category_name}
                    </span>
                    <div className="flex items-center gap-3">
                      {isEditing ? (
                        <>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={editBudget.amount}
                            onChange={(e) => setEditBudget({ ...editBudget, amount: e.target.value })}
                            className="w-24 border border-slate-200 rounded px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            autoFocus
                          />
                          <button
                            onClick={handleEditSave}
                            disabled={saving}
                            className="text-xs font-medium text-white bg-indigo-600 px-3 py-1 rounded hover:bg-indigo-700 disabled:opacity-50"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => { setEditBudget(null); setFormError(""); }}
                            className="text-xs text-slate-500 hover:text-slate-700"
                          >
                            Cancel
                          </button>
                        </>
                      ) : (
                        <>
                          <span className={`text-sm font-medium ${over ? "text-red-600" : "text-slate-700"}`}>
                            {fmt(spent)} / {fmt(b.amount)}
                          </span>
                          <button
                            onClick={() => { setEditBudget({ categoryId: b.category_id, amount: b.amount.toString() }); setFormError(""); }}
                            className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${over ? "bg-red-500" : "bg-indigo-500"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>{pct.toFixed(0)}% used</span>
                    <span>{over ? `${fmt(spent - b.amount)} over budget` : `${fmt(b.amount - spent)} remaining`}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {formError && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">
          {formError}
        </p>
      )}

      {/* Add budget */}
      {unbudgetedCategories.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
          {showAdd ? (
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 text-sm">Add Budget</h3>
              <div className="flex gap-3">
                <select
                  value={newCatId}
                  onChange={(e) => setNewCatId(e.target.value)}
                  className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select category</option>
                  {unbudgetedCategories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.icon} {c.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  placeholder="Amount"
                  className="w-32 border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  onClick={handleAddSave}
                  disabled={saving}
                  className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  {saving ? "…" : "Add"}
                </button>
                <button
                  onClick={() => { setShowAdd(false); setFormError(""); }}
                  className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setShowAdd(true); setFormError(""); }}
              className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              <Plus className="w-4 h-4" /> Set Budget for Another Category
            </button>
          )}
        </div>
      )}
    </div>
  );
}
