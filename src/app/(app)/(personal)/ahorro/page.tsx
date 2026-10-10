import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { GoalCard } from "@/features/savings/components/GoalCard";
import { GoalForm } from "@/features/savings/components/GoalForm";
import { deleteSavingsMovement } from "@/features/savings/actions";
import { getSavings } from "@/features/savings/queries";
import { requestMonth, today } from "@/lib/dates";
import { formatDay, formatMoney } from "@/lib/format";

export default function AhorroPage({ searchParams }: PageProps<"/ahorro">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Ahorro</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Ahorro searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Ahorro({ searchParams }: Pick<PageProps<"/ahorro">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const { goals, total, savedThisMonth, recent } = await getSavings(month);
  const defaultDate = today();

  return (
    <>
      <div className="rounded-2xl bg-income p-5 text-white">
        <p className="text-sm opacity-80">Total ahorrado</p>
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(total)}</p>
      </div>

      <MonthPicker month={month} basePath="/ahorro" />
      <p className="-mt-2 text-center text-sm text-muted">
        Ahorrado este mes: <span className="font-medium text-foreground tabular-nums">{formatMoney(savedThisMonth)}</span>
      </p>

      {goals.length > 0 && (
        <ul className="flex flex-col gap-2">
          {goals.map((g) => (
            <GoalCard key={g.goal.id} {...g} defaultDate={defaultDate} />
          ))}
        </ul>
      )}

      <GoalForm />

      {recent.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-2 font-medium">Últimos movimientos de ahorro</h2>
          <ul className="divide-y divide-border">
            {recent.map((m) => {
              const amount = Number(m.amount);
              return (
                <li key={m.id} className="flex items-center gap-3 py-2 text-sm">
                  <span className="text-lg">{m.goal?.icon}</span>
                  <span className="min-w-0 flex-1 truncate">
                    {m.goal?.name} <span className="text-muted">· {formatDay(m.occurred_on)}</span>
                  </span>
                  <span className={`font-medium tabular-nums ${amount > 0 ? "text-income" : "text-expense"}`}>
                    {amount > 0 ? "+" : "−"}
                    {formatMoney(Math.abs(amount))}
                  </span>
                  <form action={deleteSavingsMovement.bind(null, m.id)}>
                    <button aria-label="Borrar" className="px-1 text-muted">
                      ✕
                    </button>
                  </form>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </>
  );
}
