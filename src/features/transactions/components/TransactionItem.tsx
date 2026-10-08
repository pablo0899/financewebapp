import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import type { TransactionWithCategory } from "../queries";

export function TransactionItem({ transaction: t, action }: { transaction: TransactionWithCategory; action?: ReactNode }) {
  const isIncome = t.kind === "income";
  return (
    <li className="flex items-center gap-3 py-3">
      <span
        className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl"
        style={{ backgroundColor: `${t.category?.color ?? "#94a3b8"}22` }}
      >
        {t.category?.icon ?? "❔"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{t.category?.name ?? "Sin categoría"}</p>
        {t.note && <p className="truncate text-sm text-muted">{t.note}</p>}
      </div>
      <span className={`font-semibold tabular-nums ${isIncome ? "text-income" : "text-expense"}`}>
        {isIncome ? "+" : "−"}
        {formatMoney(Number(t.amount))}
      </span>
      {action}
    </li>
  );
}
