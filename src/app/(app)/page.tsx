import Link from "next/link";
import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { signOut } from "@/features/auth/actions";
import { CategoryBreakdown } from "@/features/dashboard/components/CategoryBreakdown";
import { MonthSummary } from "@/features/dashboard/components/MonthSummary";
import { getMonthSummary } from "@/features/dashboard/queries";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { parseMonth } from "@/lib/dates";

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
  const month = parseMonth((await searchParams).mes);
  const summary = await getMonthSummary(month);

  return (
    <>
      <MonthPicker month={month} basePath="/" />
      <MonthSummary {...summary} />
      <CategoryBreakdown rows={summary.expensesByCategory} />
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
              <TransactionItem key={t.id} transaction={t} />
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
