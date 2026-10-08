import Link from "next/link";
import { shiftMonth } from "@/lib/dates";
import { formatMonth } from "@/lib/format";

/** Selector ‹ mes › que navega cambiando ?mes=YYYY-MM. */
export function MonthPicker({ month, basePath }: { month: string; basePath: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-surface px-2 py-1">
      <Link href={`${basePath}?mes=${shiftMonth(month, -1)}`} className="px-3 py-2 text-xl text-muted" aria-label="Mes anterior">
        ‹
      </Link>
      <span className="font-medium capitalize">{formatMonth(month)}</span>
      <Link href={`${basePath}?mes=${shiftMonth(month, 1)}`} className="px-3 py-2 text-xl text-muted" aria-label="Mes siguiente">
        ›
      </Link>
    </div>
  );
}
