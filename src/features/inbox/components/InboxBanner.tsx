import Link from "next/link";
import { getPendingInboxCount } from "../queries";

/** Aviso con cuántas entradas hay por confirmar; con `quiet`, si no hay ninguna muestra un enlace discreto. */
export async function InboxBanner({ quiet = false }: { quiet?: boolean }) {
  const count = await getPendingInboxCount();
  if (count === 0) {
    return quiet ? (
      <Link href="/bandeja" className="self-end text-sm text-accent">
        📲 Captura automática
      </Link>
    ) : null;
  }
  return (
    <Link href="/bandeja" className="flex items-center justify-between rounded-xl bg-accent/10 p-4 text-sm">
      <span>
        🔔 <b>{count}</b> {count === 1 ? "movimiento por confirmar" : "movimientos por confirmar"}
      </span>
      <span className="text-accent">Revisar ›</span>
    </Link>
  );
}
