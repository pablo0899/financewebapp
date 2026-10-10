import { ConfirmButton } from "@/components/ConfirmButton";
import { formatDay, formatMoney } from "@/lib/format";
import { deleteBizExpense, deleteBizSale } from "../actions";
import type { BizExpenseRow, BizSaleRow } from "../queries";

type Entry = { type: "expense"; row: BizExpenseRow } | { type: "sale"; row: BizSaleRow };

/** Gastos y ventas del mes, juntos y agrupados por día. */
export function BizMovementList({ expenses, sales }: { expenses: BizExpenseRow[]; sales: BizSaleRow[] }) {
  const entries: Entry[] = [
    ...expenses.map((row) => ({ type: "expense" as const, row })),
    ...sales.map((row) => ({ type: "sale" as const, row })),
  ].sort((a, b) => b.row.occurred_on.localeCompare(a.row.occurred_on) || b.row.created_at.localeCompare(a.row.created_at));

  if (entries.length === 0) return <p className="py-12 text-center text-muted">Sin movimientos este mes.</p>;

  const byDay = Map.groupBy(entries, (e) => e.row.occurred_on);
  return (
    <div className="flex flex-col gap-4">
      {[...byDay].map(([day, items]) => (
        <section key={day}>
          <h2 className="mb-1 text-xs font-medium uppercase text-muted">{formatDay(day)}</h2>
          <ul className="divide-y divide-border rounded-xl bg-surface px-4">
            {items.map((e) => (e.type === "expense" ? <ExpenseItem key={e.row.id} e={e.row} /> : <SaleItem key={e.row.id} s={e.row} />))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function ExpenseItem({ e }: { e: BizExpenseRow }) {
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full text-xl" style={{ backgroundColor: `${e.category?.color ?? "#94a3b8"}22` }}>
        {e.category?.icon ?? "❔"}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{e.description}</p>
        <p className="flex items-center gap-1 truncate text-xs text-muted">
          <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: e.member?.color }} />
          {e.member?.display_name}
          {e.category && ` · ${e.category.name}`}
          {e.paid_with === "personal" && " · 👛 de su bolsa"}
        </p>
      </div>
      <span className="font-semibold tabular-nums text-chart-expense">−{formatMoney(Number(e.amount))}</span>
      <form action={deleteBizExpense.bind(null, e.id)}>
        <ConfirmButton message={`¿Borrar el gasto "${e.description}"?`} label="Borrar gasto" />
      </form>
    </li>
  );
}

function SaleItem({ s }: { s: BizSaleRow }) {
  const fees = Number(s.fees);
  return (
    <li className="flex items-center gap-3 py-3">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-border text-xl">{s.item?.icon ?? "❔"}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {s.quantity > 1 && `${s.quantity} × `}
          {s.item?.name ?? "Sin artículo"}
        </p>
        <p className="truncate text-xs text-muted">
          {[s.channel?.name, s.customer, fees > 0 && `comisión/envío ${formatMoney(fees)}`].filter(Boolean).join(" · ") || "Venta"}
        </p>
      </div>
      <span className="font-semibold tabular-nums text-chart-income">+{formatMoney(Number(s.amount) - fees)}</span>
      <form action={deleteBizSale.bind(null, s.id)}>
        <ConfirmButton message={`¿Borrar esta venta de ${s.item?.name ?? "artículo"}?`} label="Borrar venta" />
      </form>
    </li>
  );
}
