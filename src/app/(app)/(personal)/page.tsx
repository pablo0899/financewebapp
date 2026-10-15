import Link from "next/link";
import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { signOut } from "@/features/auth/actions";
import { AccountsSummary } from "@/features/accounts/components/AccountsSummary";
import { getAccountsOverview } from "@/features/accounts/queries";
import { BudgetDonut } from "@/features/budgets/components/BudgetDonut";
import { MonthSummary } from "@/features/dashboard/components/MonthSummary";
import { RecentSpending } from "@/features/dashboard/components/RecentSpending";
import { getMonthSummary, getRecentSpending } from "@/features/dashboard/queries";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { parseDays, requestMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

export default function DashboardPage({ searchParams }: PageProps<"/">) {
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Mis finanzas</h1>
        <form action={signOut}>
          <button className="text-sm text-muted">Salir</button>
        </form>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Dashboard searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Dashboard({ searchParams }: Pick<PageProps<"/">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const days = parseDays((await searchParams).dias);
  const [summary, accounts, recentSpending] = await Promise.all([
    getMonthSummary(month),
    getAccountsOverview(),
    getRecentSpending(days),
  ]);
  const categoryHref = (id: string) => `/movimientos?mes=${month}&categoria=${id}`;
  const editHref = (id: string) => `/movimientos/${id}?volver=${encodeURIComponent(`/?mes=${month}`)}`;

  return (
    <>
      {accounts.items.length > 0 ? (
        <AccountsSummary liquidity={accounts.liquidity} debt={accounts.debt} net={accounts.net} href="/cuentas" />
      ) : (
        <Link href="/cuentas" className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted">
          Da de alta tus cuentas y tarjetas para ver tu saldo real.
        </Link>
      )}
      <RecentSpending days={days} month={month} {...recentSpending} />
      <MonthPicker month={month} basePath="/" query={`dias=${days}`} />
      <MonthSummary {...summary} />

      <section className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Presupuestos del mes</h2>
          <Link href="/presupuestos" className="text-sm text-accent">
            Configurar
          </Link>
        </div>
        {summary.budgets.length === 0 ? (
          <Link href="/presupuestos" className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
            Aún no tienes presupuestos. Toca aquí para asignar un límite mensual a tus categorías.
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {summary.budgets.map((b) => (
              <Link key={b.category.id} href={categoryHref(b.category.id)} aria-label={`Ver gastos de ${b.category.name}`}>
                <BudgetDonut {...b} />
              </Link>
            ))}
          </div>
        )}
      </section>

      {(summary.unbudgeted.length > 0 || summary.uncategorized > 0 || summary.externalTransfers > 0) && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-2 font-medium">Gastos sin presupuesto</h2>
          <ul className="flex flex-col gap-1 text-sm">
            {summary.unbudgeted.map(({ category, spent }) => (
              <li key={category.id}>
                <Link href={categoryHref(category.id)} className="flex justify-between">
                  <span>
                    {category.icon} {category.name}
                  </span>
                  <span className="tabular-nums text-muted">{formatMoney(spent)} ›</span>
                </Link>
              </li>
            ))}
            {summary.uncategorized > 0 && (
              <li className="flex justify-between">
                <span>❔ Sin categoría</span>
                <span className="tabular-nums text-muted">{formatMoney(summary.uncategorized)}</span>
              </li>
            )}
            {summary.externalTransfers > 0 && (
              <li className="flex justify-between">
                <span>↗️ Transferencias externas</span>
                <span className="tabular-nums text-muted">{formatMoney(summary.externalTransfers)}</span>
              </li>
            )}
          </ul>
        </section>
      )}

      <section className="rounded-xl bg-surface px-4 pt-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Últimos movimientos</h2>
          <Link href={`/movimientos?mes=${month}`} className="text-sm text-accent">
            Ver todos
          </Link>
        </div>
        {summary.recent.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Aún no registras movimientos.</p>
        ) : (
          <ul className="divide-y divide-border">
            {summary.recent.map((t) => (
              <TransactionItem key={t.id} transaction={t} href={editHref(t.id)} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
