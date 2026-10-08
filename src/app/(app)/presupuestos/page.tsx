import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { BudgetList } from "@/features/budgets/components/BudgetList";
import { getBudgetProgress } from "@/features/budgets/queries";
import { parseMonth } from "@/lib/dates";

export default function PresupuestosPage({ searchParams }: PageProps<"/presupuestos">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Presupuestos</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Presupuestos searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Presupuestos({ searchParams }: Pick<PageProps<"/presupuestos">, "searchParams">) {
  const month = parseMonth((await searchParams).mes);
  const items = await getBudgetProgress(month);

  return (
    <>
      <MonthPicker month={month} basePath="/presupuestos" />
      <p className="text-sm text-muted">Define un límite mensual por categoría. Déjalo vacío para quitarlo.</p>
      <BudgetList items={items} month={month} />
    </>
  );
}
