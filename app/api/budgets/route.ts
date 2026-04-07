import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { Budget } from "@/lib/types";

export function GET(request: NextRequest) {
  try {
    const db = getDb();
    const { searchParams } = new URL(request.url);
    const month = searchParams.get("month"); // YYYY-MM, defaults to current

    const targetMonth =
      month ?? new Date().toISOString().slice(0, 7);

    const budgets = db
      .prepare(
        `SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon,
                COALESCE(SUM(t.amount), 0) AS spent
         FROM budgets b
         JOIN categories c ON b.category_id = c.id
         LEFT JOIN transactions t
           ON t.category_id = b.category_id
          AND strftime('%Y-%m', t.date) = b.month
          AND t.type = 'expense'
         WHERE b.month = ?
         GROUP BY b.id
         ORDER BY c.name`
      )
      .all(targetMonth) as Budget[];

    return Response.json(budgets);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const db = getDb();
    const body = (await request.json()) as {
      category_id: number;
      month: string;
      amount: number;
    };

    if (!body.category_id || !body.month || body.amount === undefined) {
      return new Response("Missing required fields", { status: 400 });
    }
    if (body.amount < 0) {
      return new Response("Amount cannot be negative", { status: 400 });
    }

    // Upsert: insert or update if (category_id, month) already exists
    db.prepare(
      `INSERT INTO budgets (category_id, month, amount)
       VALUES (@category_id, @month, @amount)
       ON CONFLICT(category_id, month) DO UPDATE SET amount = excluded.amount`
    ).run({
      category_id: body.category_id,
      month: body.month,
      amount: body.amount,
    });

    const budget = db
      .prepare(
        `SELECT b.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
         FROM budgets b JOIN categories c ON b.category_id = c.id
         WHERE b.category_id = ? AND b.month = ?`
      )
      .get(body.category_id, body.month) as Budget;

    return Response.json(budget, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}
