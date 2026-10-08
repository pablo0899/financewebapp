import "server-only";
import { getMonthTransactions } from "@/features/transactions/queries";

export async function getMonthSummary(month: string) {
  const transactions = await getMonthTransactions(month);

  let income = 0;
  let expense = 0;
  const byCategory = new Map<string, { name: string; icon: string; color: string; total: number }>();

  for (const t of transactions) {
    const amount = Number(t.amount);
    if (t.kind === "income") {
      income += amount;
      continue;
    }
    expense += amount;
    const key = t.category?.id ?? "none";
    const entry = byCategory.get(key) ?? {
      name: t.category?.name ?? "Sin categoría",
      icon: t.category?.icon ?? "❔",
      color: t.category?.color ?? "#94a3b8",
      total: 0,
    };
    entry.total += amount;
    byCategory.set(key, entry);
  }

  return {
    income,
    expense,
    balance: income - expense,
    expensesByCategory: [...byCategory.values()].sort((a, b) => b.total - a.total),
    recent: transactions.slice(0, 5),
  };
}
