import { formatMoney } from "@/lib/format";

export function MonthSummary({ income, expense, balance }: { income: number; expense: number; balance: number }) {
  return (
    <div className="rounded-2xl bg-accent p-5 text-white">
      <p className="text-sm opacity-80">Balance del mes</p>
      <p className="mb-4 text-3xl font-semibold tabular-nums">{formatMoney(balance)}</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/15 p-3">
          <p className="opacity-80">Ingresos</p>
          <p className="font-semibold tabular-nums">{formatMoney(income)}</p>
        </div>
        <div className="rounded-xl bg-white/15 p-3">
          <p className="opacity-80">Gastos</p>
          <p className="font-semibold tabular-nums">{formatMoney(expense)}</p>
        </div>
      </div>
    </div>
  );
}
