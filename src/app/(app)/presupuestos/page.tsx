import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { BudgetList } from "@/features/budgets/components/BudgetList";
import { getBudgetProgress } from "@/features/budgets/queries";
import { CategoryForm } from "@/features/categories/components/CategoryForm";
import { DeleteCategoryButton } from "@/features/categories/components/DeleteCategoryButton";
import { getCategories } from "@/features/categories/queries";
import { currentMonth } from "@/lib/dates";
import { formatMonth } from "@/lib/format";

export default function PresupuestosPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Presupuestos</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Presupuestos />
      </Suspense>
    </>
  );
}

async function Presupuestos() {
  const incomeCategories = await getCategories("income");
  // Después de leer datos del usuario la página ya es dinámica y se puede usar la fecha.
  const month = currentMonth();
  const items = await getBudgetProgress(month);

  return (
    <>
      <p className="text-sm text-muted">
        El límite que pongas se aplica cada mes y lo gastado se reinicia el día 1. Déjalo vacío para quitarlo. Avance de{" "}
        <span className="capitalize">{formatMonth(month)}</span>.
      </p>
      <BudgetList items={items} />

      <section className="rounded-xl bg-surface p-4">
        <h2 className="mb-2 font-medium">Categorías de ingreso</h2>
        <ul className="flex flex-col gap-2">
          {incomeCategories.map((c) => (
            <li key={c.id} className="flex items-center gap-3">
              <span className="text-xl">{c.icon}</span>
              <span className="flex-1">{c.name}</span>
              <DeleteCategoryButton id={c.id} name={c.name} />
            </li>
          ))}
        </ul>
      </section>

      <CategoryForm />
    </>
  );
}
