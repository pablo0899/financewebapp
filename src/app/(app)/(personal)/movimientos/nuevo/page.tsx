import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { getAccounts, getLastUsedAccountId } from "@/features/accounts/queries";
import { getPendingInboxItem } from "@/features/inbox/queries";
import { TransactionForm } from "@/features/transactions/components/TransactionForm";
import { getCategories } from "@/features/categories/queries";
import { today, toLocalDate } from "@/lib/dates";

export default function NuevoMovimientoPage({ searchParams }: PageProps<"/movimientos/nuevo">) {
  return (
    <>
      <header className="flex items-center gap-3">
        <Link href="/movimientos" className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo movimiento</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Form({ searchParams }: Pick<PageProps<"/movimientos/nuevo">, "searchParams">) {
  const { bandeja } = await searchParams;
  const [categories, accounts, lastAccountId, inboxItem] = await Promise.all([
    getCategories(),
    getAccounts(),
    getLastUsedAccountId(),
    typeof bandeja === "string" ? getPendingInboxItem(bandeja) : null,
  ]);
  return (
    <>
      {inboxItem && (
        <aside className="rounded-xl border border-dashed border-border p-3 text-sm">
          <p className="text-xs text-muted">🔔 {inboxItem.app ?? "Notificación"}</p>
          {inboxItem.title && <p className="font-medium break-words">{inboxItem.title}</p>}
          {inboxItem.body && <p className="break-words whitespace-pre-line">{inboxItem.body}</p>}
        </aside>
      )}
      <TransactionForm
        categories={categories}
        accounts={accounts}
        defaultDate={inboxItem ? toLocalDate(inboxItem.received_at) : today()}
        defaultAccountId={lastAccountId}
        inboxId={inboxItem?.id}
      />
    </>
  );
}
