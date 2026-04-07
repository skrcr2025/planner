#!/usr/bin/env node
/**
 * Seed the database with sample transactions and budgets.
 * Run: node scripts/seed.js
 */

const Database = require("better-sqlite3");
const path = require("path");
const fs = require("fs");

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "planner.db");

if (!fs.existsSync(DB_DIR)) fs.mkdirSync(DB_DIR, { recursive: true });

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Ensure tables exist (same schema as lib/db.ts)
db.exec(`
  CREATE TABLE IF NOT EXISTS categories (
    id    INTEGER PRIMARY KEY AUTOINCREMENT,
    name  TEXT    NOT NULL UNIQUE,
    type  TEXT    NOT NULL CHECK(type IN ('income','expense')),
    color TEXT    NOT NULL DEFAULT '#6366f1',
    icon  TEXT    NOT NULL DEFAULT '💰'
  );

  CREATE TABLE IF NOT EXISTS transactions (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    date        TEXT    NOT NULL,
    amount      REAL    NOT NULL CHECK(amount > 0),
    description TEXT    NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
    type        TEXT    NOT NULL CHECK(type IN ('income','expense')),
    notes       TEXT    NOT NULL DEFAULT ''
  );

  CREATE TABLE IF NOT EXISTS budgets (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    category_id INTEGER NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    month       TEXT    NOT NULL,
    amount      REAL    NOT NULL CHECK(amount >= 0),
    UNIQUE(category_id, month)
  );
`);

// Seed categories if empty
const count = db.prepare("SELECT COUNT(*) as n FROM categories").get().n;
if (count === 0) {
  const ins = db.prepare(
    "INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)"
  );
  db.transaction(() => {
    ins.run("Salary", "income", "#22c55e", "💼");
    ins.run("Freelance", "income", "#16a34a", "💻");
    ins.run("Investments", "income", "#15803d", "📈");
    ins.run("Other Income", "income", "#4ade80", "💵");
    ins.run("Housing", "expense", "#ef4444", "🏠");
    ins.run("Food & Dining", "expense", "#f97316", "🍔");
    ins.run("Transportation", "expense", "#eab308", "🚗");
    ins.run("Healthcare", "expense", "#ec4899", "🏥");
    ins.run("Shopping", "expense", "#8b5cf6", "🛍️");
    ins.run("Entertainment", "expense", "#06b6d4", "🎬");
    ins.run("Utilities", "expense", "#64748b", "⚡");
    ins.run("Education", "expense", "#0ea5e9", "📚");
    ins.run("Travel", "expense", "#f59e0b", "✈️");
    ins.run("Other Expense", "expense", "#6b7280", "📋");
  })();
  console.log("✓ Seeded categories");
}

const cats = {};
db.prepare("SELECT id, name FROM categories").all().forEach((c) => {
  cats[c.name] = c.id;
});

// Seed 3 months of sample transactions
const today = new Date();
const months = [-2, -1, 0].map((offset) => {
  const d = new Date(today.getFullYear(), today.getMonth() + offset, 1);
  return d.toISOString().slice(0, 7);
});

const insTx = db.prepare(
  "INSERT OR IGNORE INTO transactions (date, amount, description, category_id, type, notes) VALUES (?, ?, ?, ?, ?, '')"
);

const insB = db.prepare(
  "INSERT OR IGNORE INTO budgets (category_id, month, amount) VALUES (?, ?, ?)"
);

db.transaction(() => {
  for (const m of months) {
    const d = (day) => `${m}-${String(day).padStart(2, "0")}`;

    // Income
    insTx.run(d(1), 5000, "Monthly Salary", cats["Salary"], "income");
    insTx.run(d(15), 800, "Freelance Project", cats["Freelance"], "income");

    // Expenses
    insTx.run(d(2), 1500, "Rent", cats["Housing"], "expense");
    insTx.run(d(3), 120, "Electricity Bill", cats["Utilities"], "expense");
    insTx.run(d(5), 85, "Grocery Shopping", cats["Food & Dining"], "expense");
    insTx.run(d(8), 45, "Restaurant Dinner", cats["Food & Dining"], "expense");
    insTx.run(d(10), 60, "Gas", cats["Transportation"], "expense");
    insTx.run(d(12), 35, "Netflix & Spotify", cats["Entertainment"], "expense");
    insTx.run(d(14), 200, "Doctor Visit", cats["Healthcare"], "expense");
    insTx.run(d(18), 150, "Clothing", cats["Shopping"], "expense");
    insTx.run(d(20), 75, "Grocery Shopping", cats["Food & Dining"], "expense");
    insTx.run(d(22), 30, "Coffee & Snacks", cats["Food & Dining"], "expense");
    insTx.run(d(25), 40, "Internet Bill", cats["Utilities"], "expense");
    insTx.run(d(28), 50, "Books", cats["Education"], "expense");

    // Budgets
    insB.run(cats["Housing"], m, 1600);
    insB.run(cats["Food & Dining"], m, 400);
    insB.run(cats["Transportation"], m, 150);
    insB.run(cats["Entertainment"], m, 100);
    insB.run(cats["Shopping"], m, 200);
    insB.run(cats["Utilities"], m, 200);
    insB.run(cats["Healthcare"], m, 250);
    insB.run(cats["Education"], m, 100);
  }
})();

console.log("✓ Seeded transactions and budgets for", months.join(", "));
console.log("Done! Start the app with: npm run dev");
