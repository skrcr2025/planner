import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import type { Transaction } from "@/lib/types";

type Params = { params: Promise<{ id: string }> };

export async function PUT(request: NextRequest, { params }: Params) {
  try {
    const db = getDb();
    const { id } = await params;
    const body = (await request.json()) as Partial<Transaction>;

    const existing = db
      .prepare("SELECT id FROM transactions WHERE id = ?")
      .get(Number(id));
    if (!existing) {
      return new Response("Transaction not found", { status: 404 });
    }

    if (body.amount !== undefined && body.amount <= 0) {
      return new Response("Amount must be positive", { status: 400 });
    }
    if (body.type && body.type !== "income" && body.type !== "expense") {
      return new Response("Invalid type", { status: 400 });
    }

    db.prepare(
      `UPDATE transactions
       SET date        = COALESCE(@date, date),
           amount      = COALESCE(@amount, amount),
           description = COALESCE(@description, description),
           category_id = COALESCE(@category_id, category_id),
           type        = COALESCE(@type, type),
           notes       = COALESCE(@notes, notes)
       WHERE id = @id`
    ).run({
      id: Number(id),
      date: body.date ?? null,
      amount: body.amount ?? null,
      description: body.description ?? null,
      category_id: body.category_id ?? null,
      type: body.type ?? null,
      notes: body.notes ?? null,
    });

    const updated = db
      .prepare(
        `SELECT t.*, c.name AS category_name, c.color AS category_color, c.icon AS category_icon
         FROM transactions t JOIN categories c ON t.category_id = c.id
         WHERE t.id = ?`
      )
      .get(Number(id)) as Transaction;

    return Response.json(updated);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  try {
    const db = getDb();
    const { id } = await params;

    const existing = db
      .prepare("SELECT id FROM transactions WHERE id = ?")
      .get(Number(id));
    if (!existing) {
      return new Response("Transaction not found", { status: 404 });
    }

    db.prepare("DELETE FROM transactions WHERE id = ?").run(Number(id));
    return new Response(null, { status: 204 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}
