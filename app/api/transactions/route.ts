import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { Transaction } from "@/lib/types";

export function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM
    const type = searchParams.get("type"); // income | expense
    const categoryId = searchParams.get("category_id");

    let query = `
      SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
      FROM transactions t
      JOIN categories c ON t.category_id = c.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (month) {
      query += " AND strftime('%Y-%m', t.date) = ?";
      params.push(month);
    }
    if (type) {
      query += " AND t.type = ?";
      params.push(type);
    }
    if (categoryId) {
      query += " AND t.category_id = ?";
      params.push(Number(categoryId));
    }

    query += " ORDER BY t.date DESC, t.id DESC";

    const transactions = db.prepare(query).all(...params) as Transaction[];
    return Response.json(transactions);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = (await request.json()) as Omit<Transaction, "id">;

    if (!body.date || !body.amount || !body.description || !body.category_id) {
      return new Response("Missing required fields", { status: 400 });
    }
    if (body.amount <= 0) {
      return new Response("Amount must be positive", { status: 400 });
    }
    if (body.type !== "income" && body.type !== "expense") {
      return new Response("Invalid type", { status: 400 });
    }

    const result = db
      .prepare(
        `INSERT INTO transactions (date, amount, description, category_id, type, notes)
         VALUES (@date, @amount, @description, @category_id, @type, @notes)`
      )
      .run({
        date: body.date,
        amount: body.amount,
        description: body.description,
        category_id: body.category_id,
        type: body.type,
        notes: body.notes ?? "",
      });

    const created = db
      .prepare(
        `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
         FROM transactions t JOIN categories c ON t.category_id = c.id
         WHERE t.id = ?`
      )
      .get(result.lastInsertRowid) as Transaction;

    return Response.json(created, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}
