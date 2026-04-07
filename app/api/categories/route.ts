import { getDb } from "@/lib/db";
import type { Category } from "@/lib/types";

export function GET() {
  try {
    const db = getDb();
    const categories = db
      .prepare("SELECT * FROM categories ORDER BY type, name")
      .all() as Category[];
    return Response.json(categories);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return new Response(message, { status: 500 });
  }
}
