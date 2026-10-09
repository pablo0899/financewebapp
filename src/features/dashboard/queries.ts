import "server-only";
import { getBudgetProgress } from "@/features/budgets/queries";
import { getMonthSavings } from "@/features/savings/queries";
import { getMonthTransactions } from "@/features/transactions/queries";

export async function getMonthSummary(month: string) {
  const [transactions, budgets, saved] = await Promise.all([
    getMonthTransactions(month),
    getBudgetProgress(month),
    getMonthSavings(month),
  ]);

  let income = 0;
  let expense = 0;
  // Transferencias (ej. pagar la tarjeta) y ajustes de saldo no son ingreso ni gasto.
  for (const t of transactions) {
    if (t.kind === "income") income += Number(t.amount);
    if (t.kind === "expense") expense += Number(t.amount);
  }

  return {
    income,
    expense,
    saved,
    available: income - expense - saved,
    budgets: budgets.filter((b) => b.limit !== null) as ((typeof budgets)[number] & { limit: number })[],
    // Categorías sin presupuesto en las que sí hubo gasto este mes.
    unbudgeted: budgets.filter((b) => b.limit === null && b.spent > 0).sort((a, b) => b.spent - a.spent),
    uncategorized: transactions
      .filter((t) => t.kind === "expense" && !t.category_id)
      .reduce((s, t) => s + Number(t.amount), 0),
    recent: transactions.filter((t) => t.kind === "income" || t.kind === "expense").slice(0, 5),
  };
}
