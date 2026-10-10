import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { ProgressBar } from "@/components/ProgressBar";
import { Skeleton } from "@/components/Skeleton";
import { deleteAccount } from "@/features/accounts/actions";
import { KIND_LABEL } from "@/features/accounts/components/AccountCard";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { PayCardForm } from "@/features/accounts/components/PayCardForm";
import { ReconcileForm } from "@/features/accounts/components/ReconcileForm";
import { getAccounts, getAccountSummary, getAccountTransactions, type AccountSummary } from "@/features/accounts/queries";
import { TransactionItem } from "@/features/transactions/components/TransactionItem";
import { today } from "@/lib/dates";
import { formatDay, formatMoney } from "@/lib/format";

export default function CuentaPage({ params }: PageProps<"/cuentas/[id]">) {
  return (
    <>
      <header className="flex items-center gap-3">
        <Link href="/cuentas" className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold">Cuenta</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        {params.then(({ id }) => (
          <Cuenta id={id} />
        ))}
      </Suspense>
    </>
  );
}

async function Cuenta({ id }: { id: string }) {
  // El id va dentro de un filtro de PostgREST: solo se aceptan UUIDs.
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) notFound();
  const [summary, transactions, accounts] = await Promise.all([getAccountSummary(id), getAccountTransactions(id), getAccounts()]);
  if (!summary) notFound();
  const { account } = summary;

  return (
    <>
      <section className="rounded-2xl p-5 text-white" style={{ backgroundColor: account.color }}>
        <p className="text-sm opacity-90">
          {account.icon} {account.name} · {KIND_LABEL[account.kind]}
        </p>
        <p className="text-sm opacity-80">{account.kind === "credit" ? "Deuda" : "Saldo"}</p>
        <p className="text-3xl font-semibold tabular-nums">
          {formatMoney(account.kind === "credit" ? Math.max(0, -summary.balance) : summary.balance)}
        </p>
      </section>

      {account.kind === "yield" && <YieldDetails {...summary} />}
      {account.kind === "credit" && <CardDetails {...summary} />}

      {account.kind === "credit" && (
        <PayCardForm
          cardId={account.id}
          sources={accounts.filter((a) => a.kind !== "credit")}
          suggested={summary.card?.toPayNoInterest ?? 0}
          defaultDate={today()}
        />
      )}

      <ReconcileForm accountId={account.id} kind={account.kind} />

      <section className="rounded-xl bg-surface px-4 pt-4">
        <h2 className="font-medium">Movimientos</h2>
        {transactions.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">Sin movimientos en esta cuenta.</p>
        ) : (
          <ul className="divide-y divide-border">
            {transactions.map((t) => (
              <TransactionItem key={t.id} transaction={t} accountId={account.id} detail={<p className="text-xs text-muted">{formatDay(t.occurred_on)}</p>} />
            ))}
          </ul>
        )}
      </section>

      <details className="rounded-xl bg-surface">
        <summary className="cursor-pointer p-4 font-medium">Configuración</summary>
        <div className="flex flex-col gap-3 px-1 pb-1">
          <AccountForm account={account} />
          <form action={deleteAccount.bind(null, account.id)} className="flex items-center justify-between px-4 pb-3 text-sm text-muted">
            Borrar cuenta (sus movimientos se conservan sin cuenta)
            <ConfirmButton message={`¿Borrar la cuenta "${account.name}"?`} label={`Borrar cuenta ${account.name}`} />
          </form>
        </div>
      </details>
    </>
  );
}

function Row({ label, value, tone = "" }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-muted">{label}</span>
      <span className={`text-right font-medium tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

function YieldDetails({ book, interest, interestSince, rate, daily, projection30 }: AccountSummary) {
  if (rate <= 0) {
    return <p className="text-sm text-muted">Configura la tasa anual en “Configuración” para estimar tus rendimientos.</p>;
  }
  return (
    <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <h2 className="font-medium">Rendimientos (estimados)</h2>
      <Row label="Tasa anual" value={`${(rate * 100).toFixed(2).replace(/\.?0+$/, "")}%`} />
      <Row label="Rendimiento por día" value={`+${formatMoney(daily)}`} tone="text-income" />
      <Row label="En 30 días (si no mueves el saldo)" value={`+${formatMoney(projection30)}`} tone="text-income" />
      <Row label={`Acumulado desde el ${formatDay(interestSince)}`} value={`+${formatMoney(interest)}`} tone="text-income" />
      <Row label="Saldo sin rendimiento estimado" value={formatMoney(book)} />
      <p className="text-xs text-muted">
        Es una estimación con interés compuesto diario. Usa “Ajustar saldo” con el saldo real de la app para corregirla.
      </p>
    </section>
  );
}

function CardDetails({ card, account }: AccountSummary) {
  if (!card) {
    return <p className="text-sm text-muted">Configura el día de corte y de pago en “Configuración” para ver tu estado de cuenta.</p>;
  }
  const late = card.daysToDue !== null && card.daysToDue < 0 && card.toPayNoInterest > 0;

  return (
    <section className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <div className="rounded-lg bg-background p-3">
        <p className="text-sm text-muted">Para no generar intereses paga</p>
        <p className="text-2xl font-semibold tabular-nums">{formatMoney(card.toPayNoInterest)}</p>
        {card.dueDate && (
          <p className={`text-sm ${late ? "font-medium text-expense" : "text-muted"}`}>
            {card.toPayNoInterest === 0
              ? "✓ Estado de cuenta liquidado"
              : late
                ? `⚠ Venció el ${formatDay(card.dueDate)}`
                : `Antes del ${formatDay(card.dueDate)} · ${card.daysToDue === 0 ? "vence hoy" : `faltan ${card.daysToDue} días`}`}
          </p>
        )}
      </div>
      <Row label={`Compras desde el corte (${formatDay(card.lastCut)})`} value={formatMoney(card.periodSpending)} />
      <Row label="Próximo corte" value={formatDay(card.nextCut)} />
      {card.available !== null && account.credit_limit !== null && (
        <>
          <Row label="Crédito disponible" value={`${formatMoney(card.available)} de ${formatMoney(Number(account.credit_limit))}`} />
          <ProgressBar value={card.debt} max={Number(account.credit_limit)} color={account.color} />
        </>
      )}
    </section>
  );
}
