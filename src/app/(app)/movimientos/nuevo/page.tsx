import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { getCategories } from "@/features/categories/queries";
import { today } from "@/lib/dates";

export default function NuevoMovimientoPage() {
  return (
    <>
      <header className="flex items-center gap-3">
        <Link href="/movimientos" className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form />
      </Suspense>
    </>
  );
}

async function Form() {
  const categories = await getCategories();
  return <TransactionForm categories={categories} defaultDate={today()} />;
}
