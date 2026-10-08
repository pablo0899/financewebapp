import { ProgressBar } from "@/components/ProgressBar";
import { formatMoney } from "@/lib/format";
import { saveBudget } from "../actions";
import type { BudgetProgress } from "../queries";

export function BudgetList({ items, month }: { items: BudgetProgress[]; month: string }) {
  const withLimit = items.filter((i) => i.limit !== null);
  const totalLimit = withLimit.reduce((s, i) => s + (i.limit ?? 0), 0);
  const totalSpent = withLimit.reduce((s, i) => s + i.spent, 0);

  return (
    <div className="flex flex-col gap-4">
      {withLimit.length > 0 && (
        <div className="rounded-xl bg-surface p-4">
          <p className="text-sm text-muted">Total presupuestado</p>
          <p className="mb-2 text-lg font-semibold tabular-nums">
            {formatMoney(totalSpent)} <span className="text-sm font-normal text-muted">de {formatMoney(totalLimit)}</span>
          </p>
          <ProgressBar value={totalSpent} max={totalLimit} />
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {items.map(({ category, limit, spent }) => (
          <li key={category.id} className="rounded-xl bg-surface p-4">
            <form action={saveBudget} className="mb-2 flex items-center gap-3">
              <input type="hidden" name="category_id" value={category.id} />
              <input type="hidden" name="month" value={month} />
              <span className="text-xl">{category.icon}</span>
              <span className="flex-1 font-medium">{category.name}</span>
              <input
                name="amount"
                inputMode="decimal"
                defaultValue={limit ?? ""}
                placeholder="Sin límite"
                className="w-28 rounded-lg border border-border bg-background px-2 py-1 text-right tabular-nums outline-none focus:border-accent"
              />
              <button className="text-sm text-accent">OK</button>
            </form>
            <div className="flex justify-between text-sm text-muted tabular-nums">
              <span>Gastado {formatMoney(spent)}</span>
              {limit !== null && (
                <span className={spent > limit ? "text-expense" : ""}>
                  {spent > limit ? `Excedido ${formatMoney(spent - limit)}` : `Quedan ${formatMoney(limit - spent)}`}
                </span>
              )}
            </div>
            {limit !== null && (
              <div className="mt-2">
                <ProgressBar value={spent} max={limit} color={category.color} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
