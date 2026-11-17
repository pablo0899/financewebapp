import Link from "next/link";
import { ConfirmButton } from "@/components/ConfirmButton";
import { LOCALE, TIMEZONE } from "@/lib/config";
import type { InboxItem } from "@/lib/supabase/database.types";
import { dismissAllInbox, dismissInboxItem } from "../actions";

const when = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: TIMEZONE,
});

const SOURCE_ICON: Record<string, string> = { notification: "🔔", email: "✉️", sms: "💬" };

export function InboxList({ items }: { items: InboxItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-xl bg-surface p-6 text-center text-sm text-muted">
        No hay nada por confirmar. Lo que llegue de tus notificaciones aparecerá aquí.
      </p>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <ul className="flex flex-col gap-2">
        {items.map((item) => (
          <InboxCard key={item.id} item={item} />
        ))}
      </ul>
      {items.length > 1 && (
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
  );
}

function InboxCard({ item }: { item: InboxItem }) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="flex items-start gap-2">
        <span className="text-lg">{SOURCE_ICON[item.source] ?? "🔔"}</span>
        <div className="min-w-0 flex-1">
          <p className="flex justify-between gap-2 text-xs text-muted">
            <span className="truncate">{item.app ?? "Desconocido"}</span>
            <span className="shrink-0">{when.format(new Date(item.received_at))}</span>
          </p>
          {item.title && <p className="font-medium break-words">{item.title}</p>}
          {item.body && <p className="text-sm break-words whitespace-pre-line">{item.body}</p>}
        </div>
      </div>
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
