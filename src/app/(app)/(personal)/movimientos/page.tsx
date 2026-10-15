import Link from "next/link";
import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { getAccounts } from "@/features/accounts/queries";
import { getCategories } from "@/features/categories/queries";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { getMonthTransactions, getRecentTransactions } from "@/features/transactions/queries";
import { parseDays, requestMonth } from "@/lib/dates";
import { formatMoney, formatMonth } from "@/lib/format";

export default function MovimientosPage({ searchParams }: PageProps<"/movimientos">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Movimientos searchParams={searchParams} />
      </Suspense>
    </>
  );
}

/**
 * Filtros por URL:
 * - `?mes=YYYY-MM`: movimientos del mes (por defecto el actual).
 * - `?categoria=<id>`: solo esa categoría (ej. desde un anillo de presupuesto).
 * - `?dias=N`: solo los gastos de los últimos N días (en vez del mes).
 */
async function Movimientos({ searchParams }: Pick<PageProps<"/movimientos">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const { dias, categoria } = await searchParams;
  const days = dias === undefined ? null : parseDays(dias);
  const categoryId = typeof categoria === "string" ? categoria : null;

  const [all, accounts, categories] = await Promise.all([
    days ? getRecentTransactions(days) : getMonthTransactions(month),
    getAccounts(),
    getCategories(),
  ]);
  const category = categories.find((c) => c.id === categoryId) ?? null;
  const transactions = all.filter(
    (t) => (!category || t.category_id === category.id) && (!days || t.kind === "expense"),
  );
  const spent = transactions.filter((t) => t.kind === "expense").reduce((s, t) => s + Number(t.amount), 0);

  const query = new URLSearchParams();
  if (days) query.set("dias", String(days));
  else query.set("mes", month);
  if (category) query.set("categoria", category.id);
  const returnTo = `/movimientos?${query}`;

  return (
    <>
      {!days && <MonthPicker month={month} basePath="/movimientos" query={category ? `categoria=${category.id}` : ""} />}

      {(days || category) && (
        <section className="flex items-center gap-3 rounded-xl bg-surface p-4">
          {category && <span className="text-3xl">{category.icon}</span>}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted">
              {category ? `${category.name} · ` : "Gastado · "}
              {days ? `últimos ${days} días` : <span className="capitalize">{formatMonth(month)}</span>}
            </p>
            <p className="text-2xl font-semibold tabular-nums">{formatMoney(spent)}</p>
            {category?.monthly_budget != null && !days && (
              <p className="text-xs tabular-nums text-muted">de {formatMoney(Number(category.monthly_budget))} de presupuesto</p>
            )}
          </div>
          <Link
            href={days ? "/movimientos" : `/movimientos?mes=${month}`}
            className="rounded-full border border-border px-3 py-1 text-sm text-muted"
          >
            Ver todos ✕
          </Link>
        </section>
      )}

      <TransactionList
        transactions={transactions}
        accounts={accounts}
        returnTo={returnTo}
        empty={days ? `Sin gastos en los últimos ${days} días.` : category ? "Sin movimientos de esta categoría este mes." : undefined}
      />
    </>
  );
}
