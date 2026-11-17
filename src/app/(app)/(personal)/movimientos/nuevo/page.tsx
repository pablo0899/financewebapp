import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { getAccounts, getLastUsedAccountId } from "@/features/accounts/queries";
import { cleanText, describe, matchAccount, parseInboxItem } from "@/features/inbox/parse";
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
  const parsed = inboxItem ? parseInboxItem(inboxItem) : null;
  const movement = parsed?.type === "movement" ? parsed : null;
  const prefill = movement
    ? {
        kind: movement.kind === "transfer_out" ? ("transfer" as const) : movement.kind,
        amount: String(movement.amount),
        accountId: matchAccount(accounts, movement.accountHint)?.id ?? null,
        // Lo que se manda a otra persona sale como transferencia a cuenta externa
        // (mismo valor que EXTERNAL en TransactionForm / actions).
        toAccountId: movement.kind === "transfer_out" ? "external" : null,
        note: describe(movement),
      }
    : undefined;

  return (
    <>
      {inboxItem && (
        <details className="rounded-xl border border-dashed border-border p-3 text-sm">
          <summary className="cursor-pointer text-muted">
            {inboxItem.source === "email" ? "✉️" : "🔔"} {inboxItem.app ?? "Notificación"} · {inboxItem.title}
          </summary>
          <p className="mt-2 break-words whitespace-pre-line">
            {cleanText([inboxItem.title, inboxItem.body].filter(Boolean).join("\n"))}
          </p>
        </details>
      )}
      <TransactionForm
        categories={categories}
        accounts={accounts}
        defaultDate={inboxItem ? toLocalDate(inboxItem.received_at) : today()}
        defaultAccountId={lastAccountId}
        inboxId={inboxItem?.id}
        prefill={prefill}
      />
    </>
  );
}
