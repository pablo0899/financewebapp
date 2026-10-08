import "server-only";
import { requireUser } from "@/lib/supabase/server";
import { getCategories, getMonthTransactions } from "@/features/transactions/queries";

/** Por cada categoría de gasto: límite del mes (si existe) y lo gastado. */
export async function getBudgetProgress(month: string) {
  const { supabase } = await requireUser();
  const [categories, transactions, budgetsResult] = await Promise.all([
    getCategories("expense"),
    getMonthTransactions(month),
    supabase.from("budgets").select("category_id, amount").eq("month", `${month}-01`),
  ]);
  if (budgetsResult.error) throw budgetsResult.error;

  const limits = new Map(budgetsResult.data.map((b) => [b.category_id, Number(b.amount)]));
  const spent = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind === "expense" && t.category_id) {
      spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + Number(t.amount));
    }
  }

  return categories.map((category) => ({
    category,
    limit: limits.get(category.id) ?? null,
    spent: spent.get(category.id) ?? 0,
  }));
}

export type BudgetProgress = Awaited<ReturnType<typeof getBudgetProgress>>[number];
