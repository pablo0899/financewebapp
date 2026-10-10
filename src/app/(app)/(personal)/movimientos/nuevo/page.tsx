import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { getAccounts, getLastUsedAccountId } from "@/features/accounts/queries";
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
  const [categories, accounts, lastAccountId] = await Promise.all([
    getCategories(),
    getAccounts(),
    getLastUsedAccountId(),
  ]);
  return (
    <TransactionForm categories={categories} accounts={accounts} defaultDate={today()} defaultAccountId={lastAccountId} />
  );
}
