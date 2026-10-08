import { Donut } from "@/components/Donut";
import { formatMoney } from "@/lib/format";
import type { BudgetProgress } from "../queries";

/** Gastado vs. restante del presupuesto mensual de una categoría. */
export function BudgetDonut({ category, spent, limit }: BudgetProgress & { limit: number }) {
  const over = spent > limit;
  const pct = Math.round((spent / limit) * 100);
  const label = `${category.name}: gastado ${formatMoney(spent)} de ${formatMoney(limit)}`;

  return (
    <div className="flex flex-col items-center gap-2 rounded-xl bg-surface p-3 text-center">
      <Donut value={spent} max={limit} color={category.color} label={label}>
        <span className="text-2xl">{category.icon}</span>
        <span className="text-sm font-semibold tabular-nums">{pct}%</span>
      </Donut>
      <p className="w-full truncate text-sm font-medium">{category.name}</p>
      <p className="text-xs tabular-nums text-muted">
        {formatMoney(spent)} de {formatMoney(limit)}
      </p>
      <p className={`text-xs font-medium tabular-nums ${over ? "text-expense" : "text-foreground"}`}>
        {over ? `⚠ Excedido ${formatMoney(spent - limit)}` : `Quedan ${formatMoney(limit - spent)}`}
      </p>
    </div>
  );
}
