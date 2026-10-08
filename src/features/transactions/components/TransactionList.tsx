import { formatDay } from "@/lib/format";
import { deleteTransaction } from "../actions";
import type { TransactionWithCategory } from "../queries";
import { TransactionItem } from "./TransactionItem";

/** Lista agrupada por día, con botón para borrar cada movimiento. */
export function TransactionList({ transactions }: { transactions: TransactionWithCategory[] }) {
  if (transactions.length === 0) {
    return <p className="py-12 text-center text-muted">Sin movimientos este mes.</p>;
  }

  const byDay = Map.groupBy(transactions, (t) => t.occurred_on);

  return (
    <div className="flex flex-col gap-4">
      {[...byDay].map(([day, items]) => (
        <section key={day}>
          <h2 className="mb-1 text-xs font-medium uppercase text-muted">{formatDay(day)}</h2>
          <ul className="divide-y divide-border rounded-xl bg-surface px-4">
            {items.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                action={
                  <form action={deleteTransaction.bind(null, t.id)}>
                    <button aria-label="Borrar" className="px-1 text-muted">
                      ✕
                    </button>
                  </form>
                }
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
