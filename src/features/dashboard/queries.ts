import "server-only";
import { getBudgetProgress } from "@/features/budgets/queries";
import { getMonthSavings } from "@/features/savings/queries";
import { getMonthTransactions, getRecentTransactions } from "@/features/transactions/queries";

export async function getMonthSummary(month: string) {
  const [transactions, budgets, saved] = await Promise.all([
    getMonthTransactions(month),
    getBudgetProgress(month),
    getMonthSavings(month),
  ]);

  let income = 0;
  let expense = 0;
  let unidentified = 0;
  // Las transferencias entre cuentas propias (ej. pagar la tarjeta) no son ingreso
  // ni gasto; las transferencias a cuentas externas sí son gasto (kind "expense").
  for (const t of transactions) {
    if (t.kind === "income") income += Number(t.amount);
    if (t.kind === "expense") expense += Number(t.amount);
    // Ajustes que bajaron el saldo de una cuenta de dinero (no tarjetas): salió
    // dinero sin registrarse. Los positivos (alta de la cuenta, rendimientos) no cuentan.
    if (t.kind === "adjustment" && t.account && t.account.kind !== "credit" && Number(t.amount) < 0) {
      unidentified -= Number(t.amount);
    }
  }

  return {
    income,
    expense,
    saved,
    unidentified,
    available: income - expense - unidentified - saved,
    budgets: budgets.filter((b) => b.limit !== null) as ((typeof budgets)[number] & { limit: number })[],
    // Categorías sin presupuesto en las que sí hubo gasto este mes.
    unbudgeted: budgets.filter((b) => b.limit === null && b.spent > 0).sort((a, b) => b.spent - a.spent),
    uncategorized: transactions
      .filter((t) => t.kind === "expense" && !t.category_id && !t.external)
      .reduce((s, t) => s + Number(t.amount), 0),
    externalTransfers: transactions
      .filter((t) => t.external && !t.category_id)
      .reduce((s, t) => s + Number(t.amount), 0),
    recent: transactions.filter((t) => t.kind === "income" || t.kind === "expense").slice(0, 5),
  };
}

/** Total gastado (gastos y transferencias externas) en los últimos `days` días. */
export async function getRecentSpending(days: number) {
  const expenses = (await getRecentTransactions(days)).filter((t) => t.kind === "expense");
  return { total: expenses.reduce((s, t) => s + Number(t.amount), 0), count: expenses.length };
}
