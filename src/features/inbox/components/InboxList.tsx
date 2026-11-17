import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LOCALE, TIMEZONE } from "@/lib/config";
import { formatMoney } from "@/lib/format";
import type { InboxItem } from "@/lib/supabase/database.types";
import { dismissAllInbox, dismissInboxItem, dismissInboxItems } from "../actions";
import { cleanText, parseInboxItem, type Parsed } from "../parse";

const when = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
});

const SOURCE_ICON: Record<string, string> = { notification: "🔔", email: "✉️", sms: "💬" };

const KIND_LABEL = { expense: "Gasto", income: "Ingreso", transfer_out: "Transferencia enviada" } as const;

export function InboxList({ items }: { items: InboxItem[] }) {
  const parsed = items.map((item) => ({ item, parsed: parseInboxItem(item) }));
  const relevant = parsed.filter((p) => p.parsed.type !== "ignore");
  const ignored = parsed.filter((p) => p.parsed.type === "ignore");

  return (
    <>
      {relevant.length === 0 ? (
        <p className="rounded-xl bg-surface p-6 text-center text-sm text-muted">
          No hay nada por confirmar. Lo que llegue de tus correos y notificaciones aparecerá aquí.
        </p>
      ) : (
        <section className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {relevant.map(({ item, parsed }) => (
              <InboxCard key={item.id} item={item} parsed={parsed} />
            ))}
          </ul>
          {relevant.length > 1 && (
            <form action={dismissAllInbox} className="self-center">
              <ConfirmButton
                message={`¿Descartar las ${items.length} entradas? No se registra ningún movimiento.`}
                label="Descartar todo"
                className="text-sm text-muted"
              >
                Descartar todo
              </ConfirmButton>
            </form>
          )}
        </section>
      )}

      {ignored.length > 0 && (
        <details className="rounded-xl bg-surface p-4 text-sm">
          <summary className="cursor-pointer text-muted">
            No parecen movimientos ({ignored.length})
          </summary>
          <ul className="mt-2 flex flex-col divide-y divide-border">
            {ignored.map(({ item, parsed }) => (
              <li key={item.id} className="flex items-center gap-2 py-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate">{item.title ?? item.body}</p>
                  <p className="text-xs text-muted">{parsed.type === "ignore" && parsed.reason}</p>
                </div>
                <Link href={`/movimientos/nuevo?bandeja=${item.id}`} className="shrink-0 text-accent">
                  Registrar
                </Link>
              </li>
            ))}
          </ul>
          <form action={dismissInboxItems.bind(null, ignored.map(({ item }) => item.id))} className="mt-2">
            <button className="w-full rounded-lg border border-border py-2 text-muted">Descartar estos</button>
          </form>
        </details>
      )}
    </>
  );
}

function InboxCard({ item, parsed }: { item: InboxItem; parsed: Parsed }) {
  const text = cleanText([item.title, item.body].filter(Boolean).join("\n"));

  return (
    <li className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <p className="flex justify-between gap-2 text-xs text-muted">
        <span className="truncate">
          {SOURCE_ICON[item.source] ?? "🔔"} {item.app ?? "Desconocido"}
        </span>
        <span className="shrink-0">{when.format(new Date(item.received_at))}</span>
      </p>

      {parsed.type === "movement" ? (
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted">{KIND_LABEL[parsed.kind]}</p>
            <p className="truncate font-medium">{parsed.counterparty ?? item.title}</p>
            {parsed.bank && <p className="truncate text-xs text-muted">{parsed.bank}</p>}
          </div>
          <span className={`text-lg font-semibold tabular-nums ${parsed.kind === "income" ? "text-income" : "text-expense"}`}>
            {parsed.kind === "income" ? "+" : "−"}
            {formatMoney(parsed.amount)}
          </span>
        </div>
      ) : (
        <p className="line-clamp-4 text-sm break-words whitespace-pre-line">{text}</p>
      )}

      {parsed.type === "movement" && (
        <details className="text-xs text-muted">
          <summary className="cursor-pointer">Ver texto original</summary>
          <p className="mt-1 break-words whitespace-pre-line">{text}</p>
        </details>
      )}

      <div className="flex items-center gap-2">
        <Link
          href={`/movimientos/nuevo?bandeja=${item.id}`}
          className="flex-1 rounded-lg bg-accent py-2 text-center text-sm font-medium text-white"
        >
          Registrar
        </Link>
        <form action={dismissInboxItem.bind(null, item.id)}>
          <button className="rounded-lg border border-border px-4 py-2 text-sm text-muted">Descartar</button>
        </form>
      </div>
    </li>
  );
}
