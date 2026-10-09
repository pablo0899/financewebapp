import Link from "next/link";
import { formatDay, formatMoney } from "@/lib/format";
import type { AccountSummary } from "../queries";

export const KIND_LABEL = { debit: "Débito", credit: "Tarjeta de crédito", yield: "Rendimiento" } as const;

/** Renglón de una cuenta con su saldo y lo más importante según su tipo. */
export function AccountCard({ account, balance, daily, rate, card }: AccountSummary) {
  const isCredit = account.kind === "credit";
  const debt = Math.max(0, -balance);

  return (
    <li>
      <Link href={`/cuentas/${account.id}`} className="flex items-center gap-3 rounded-xl bg-surface p-4">
        <span
          className="flex size-11 shrink-0 items-center justify-center rounded-full text-2xl"
          style={{ backgroundColor: `${account.color}22` }}
        >
          {account.icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{account.name}</p>
          <p className="truncate text-xs text-muted">
            {account.kind === "yield" && rate > 0
              ? `${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}% anual · +${formatMoney(daily)}/día est.`
              : isCredit && card && card.toPayNoInterest > 0 && card.dueDate
                ? `Paga ${formatMoney(card.toPayNoInterest)} antes del ${formatDay(card.dueDate)}`
                : KIND_LABEL[account.kind]}
          </p>
        </div>
        <div className="text-right">
          <p className={`font-semibold tabular-nums ${isCredit && debt > 0 ? "text-expense" : ""}`}>
            {isCredit ? (debt > 0 ? `−${formatMoney(debt)}` : formatMoney(0)) : formatMoney(balance)}
          </p>
          {isCredit && <p className="text-xs text-muted">deuda</p>}
        </div>
      </Link>
    </li>
  );
}
