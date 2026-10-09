import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import type { TransactionWithCategory } from "../queries";

type Props = {
  transaction: TransactionWithCategory;
  /** Desde la vista de una cuenta, para dar el signo correcto a transferencias. */
  accountId?: string;
  /** Debajo del nombre (ej. selector de cuenta). */
  detail?: ReactNode;
  action?: ReactNode;
};

export function TransactionItem({ transaction: t, accountId, detail, action }: Props) {
  const amount = Number(t.amount);
  let icon = t.category?.icon ?? "❔";
  let iconBg = `${t.category?.color ?? "#94a3b8"}22`;
  let title = t.category?.name ?? "Sin categoría";
  let sign: "+" | "−" | "" = t.kind === "income" ? "+" : "−";
  let tone = t.kind === "income" ? "text-income" : "text-expense";

  if (t.kind === "transfer") {
    icon = "↔️";
    iconBg = "var(--border)";
    title = `${t.account?.name ?? "?"} → ${t.to_account?.name ?? "?"}`;
    sign = accountId === undefined ? "" : t.to_account_id === accountId ? "+" : "−";
    tone = "text-foreground";
  } else if (t.kind === "adjustment") {
    icon = "⚖️";
    iconBg = "var(--border)";
    title = `${t.note ?? "Ajuste de saldo"}`;
    sign = amount > 0 ? "+" : "−";
    tone = "text-muted";
  }

  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl" style={{ backgroundColor: iconBg }}>
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{title}</p>
        {t.kind !== "adjustment" && t.note && <p className="truncate text-sm text-muted">{t.note}</p>}
        {detail ??
          (t.account && t.kind !== "transfer" && (
            <p className="truncate text-xs text-muted">
              {t.account.icon} {t.account.name}
            </p>
          ))}
      </div>
      <span className={`font-semibold tabular-nums ${tone}`}>
        {sign}
        {formatMoney(Math.abs(amount))}
      </span>
      {action}
    </li>
  );
}
