import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DB_DIR, "planner.db");

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
  }

  db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");

  initializeSchema(db);
  return db;
}

function initializeSchema(db: Database.Database): void {
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

  // Seed default categories if none exist
  const count = (
    db.prepare("SELECT COUNT(*) as n FROM categories").get() as { n: number }
  ).n;

  if (count === 0) {
    const insertCategory = db.prepare(
      "INSERT INTO categories (name, type, color, icon) VALUES (?, ?, ?, ?)"
    );

    const seedCategories = db.transaction(() => {
      // Income categories
      insertCategory.run("Salary", "income", "#22c55e", "💼");
      insertCategory.run("Freelance", "income", "#16a34a", "💻");
      insertCategory.run("Investments", "income", "#15803d", "📈");
      insertCategory.run("Other Income", "income", "#4ade80", "💵");

      // Expense categories
      insertCategory.run("Housing", "expense", "#ef4444", "🏠");
      insertCategory.run("Food & Dining", "expense", "#f97316", "🍔");
      insertCategory.run("Transportation", "expense", "#eab308", "🚗");
      insertCategory.run("Healthcare", "expense", "#ec4899", "🏥");
      insertCategory.run("Shopping", "expense", "#8b5cf6", "🛍️");
      insertCategory.run("Entertainment", "expense", "#06b6d4", "🎬");
      insertCategory.run("Utilities", "expense", "#64748b", "⚡");
      insertCategory.run("Education", "expense", "#0ea5e9", "📚");
      insertCategory.run("Travel", "expense", "#f59e0b", "✈️");
      insertCategory.run("Other Expense", "expense", "#6b7280", "📋");
    });

    seedCategories();
  }
}
