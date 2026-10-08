import "server-only";
import { getCategories } from "@/features/categories/queries";
import { getMonthTransactions } from "@/features/transactions/queries";

/**
 * Por cada categoría de gasto: su presupuesto mensual (si tiene) y lo gastado
 * en `month`. El presupuesto es fijo; lo gastado se reinicia cada mes.
 */
export async function getBudgetProgress(month: string) {
  const [categories, transactions] = await Promise.all([getCategories("expense"), getMonthTransactions(month)]);

  const spent = new Map<string, number>();
  for (const t of transactions) {
    if (t.kind === "expense" && t.category_id) {
      spent.set(t.category_id, (spent.get(t.category_id) ?? 0) + Number(t.amount));
    }
  }

  return categories.map((category) => ({
    category,
    limit: category.monthly_budget === null ? null : Number(category.monthly_budget),
    spent: spent.get(category.id) ?? 0,
  }));
}

export type BudgetProgress = Awaited<ReturnType<typeof getBudgetProgress>>[number];
