import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LOCALE, TIMEZONE } from "@/lib/config";
import { formatDay, formatMoney } from "@/lib/format";
import type { InboxItem } from "@/lib/supabase/database.types";
import { dismissAllInbox, dismissInboxItem, dismissInboxItems, linkInboxItem } from "../actions";
import { cleanText, parseInboxItem, type Parsed } from "../parse";
import type { DuplicateCandidate } from "../queries";

const when = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
});

const SOURCE_ICON: Record<string, string> = { notification: "🔔", email: "✉️", sms: "💬" };

const KIND_LABEL = { expense: "Gasto", income: "Ingreso", transfer_out: "Transferencia enviada" } as const;

export function InboxList({
  items,
  duplicates,
}: {
  items: InboxItem[];
  /** Movimientos ya registrados que podrían ser la misma entrada (por id de entrada). */
  duplicates: Map<string, DuplicateCandidate[]>;
}) {
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
              <InboxCard key={item.id} item={item} parsed={parsed} candidates={duplicates.get(item.id) ?? []} />
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

function InboxCard({ item, parsed, candidates }: { item: InboxItem; parsed: Parsed; candidates: DuplicateCandidate[] }) {
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

      {candidates.length > 0 && (
        <div className="flex flex-col gap-2 rounded-lg bg-accent/10 p-3 text-sm">
          <p className="font-medium">¿Ya lo registraste? Hay un movimiento con el mismo monto:</p>
          {candidates.slice(0, 3).map((c) => (
            <form key={c.id} action={linkInboxItem.bind(null, item.id, c.id)} className="flex items-center gap-2">
              <span className="min-w-0 flex-1 truncate">
                {c.category?.icon ?? "❔"} {c.note ?? c.category?.name ?? "Sin nota"} · {formatDay(c.occurred_on)}
                {c.account && <span className="text-muted"> · {c.account.name}</span>}
              </span>
              <button className="shrink-0 rounded-lg bg-accent px-3 py-1 text-xs font-medium text-white">Es este</button>
            </form>
          ))}
        </div>
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
          className={`flex-1 rounded-lg py-2 text-center text-sm font-medium ${candidates.length > 0 ? "border border-border text-foreground" : "bg-accent text-white"}`}
        >
          {candidates.length > 0 ? "No, registrar aparte" : "Registrar"}
        </Link>
        <form action={dismissInboxItem.bind(null, item.id)}>
          <button className="rounded-lg border border-border px-4 py-2 text-sm text-muted">Descartar</button>
        </form>
      </div>
    </li>
  );
}
