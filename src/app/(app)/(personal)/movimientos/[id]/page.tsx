import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Skeleton } from "@/components/Skeleton";
import { getAccounts } from "@/features/accounts/queries";
import { getCategories } from "@/features/categories/queries";
import { deleteTransactionAndReturn } from "@/features/transactions/actions";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { getTransaction } from "@/features/transactions/queries";
import { formatDay, formatMoney } from "@/lib/format";

export default function EditarMovimientoPage({ params, searchParams }: PageProps<"/movimientos/[id]">) {
  return (
    <Suspense fallback={<Skeleton className="h-96" />}>
      {Promise.all([params, searchParams]).then(([{ id }, { volver }]) => (
        <Editar id={id} returnTo={typeof volver === "string" && volver.startsWith("/") && !volver.startsWith("//") ? volver : null} />
      ))}
    </Suspense>
  );
}

async function Editar({ id, returnTo }: { id: string; returnTo: string | null }) {
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const [transaction, categories, accounts] = await Promise.all([getTransaction(id), getCategories(), getAccounts()]);
  if (!transaction) notFound();
  const back = returnTo ?? `/movimientos?mes=${transaction.occurred_on.slice(0, 7)}`;

  return (
    <>
      <header className="flex items-center gap-3">
        <Link href={back} className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="flex-1 text-2xl font-semibold">Editar movimiento</h1>
        <form action={deleteTransactionAndReturn.bind(null, transaction.id, back)}>
          <ConfirmButton message="¿Borrar este movimiento?" label="Borrar movimiento" />
        </form>
      </header>

      {transaction.kind === "adjustment" ? (
        <p className="rounded-xl bg-surface p-4 text-sm text-muted">
          Ajuste de saldo de {formatMoney(Number(transaction.amount))} del {formatDay(transaction.occurred_on)}. Los ajustes no se
          editan: si quedó mal, bórralo y vuelve a usar “Ajustar saldo” en la cuenta.
        </p>
      ) : (
        <TransactionForm
          categories={categories}
          accounts={accounts}
          defaultDate={transaction.occurred_on}
          defaultAccountId={transaction.account_id}
          transaction={transaction}
          returnTo={back}
        />
      )}
    </>
  );
}
