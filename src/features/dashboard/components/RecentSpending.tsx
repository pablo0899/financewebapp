import Form from "next/form";
import Link from "next/link";
import { formatMoney } from "@/lib/format";

const PRESETS = [7, 15, 30];

/** Total gastado en los últimos N días (N con atajos o a mano vía ?dias=). */
export function RecentSpending({ days, total, count, month }: { days: number; total: number; count: number; month: string }) {
  return (
    <section className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-medium">Gastado en los últimos</h2>
        <Form action="/" scroll={false} replace className="flex items-center gap-1 text-sm">
          <input type="hidden" name="mes" value={month} />
          {PRESETS.map((n) => (
            <Link
              key={n}
              href={`/?mes=${month}&dias=${n}`}
              scroll={false}
              replace
              className={`rounded-full px-2.5 py-1 ${days === n ? "bg-accent text-white" : "text-muted"}`}
            >
              {n}
            </Link>
          ))}
          {/* 16px para que iOS no haga zoom. */}
          <input
            name="dias"
            type="number"
            min={1}
            max={365}
            inputMode="numeric"
            placeholder="N"
            defaultValue={PRESETS.includes(days) ? undefined : days}
            key={days}
            aria-label="Número de días"
            className={`w-14 rounded-full border px-2 py-0.5 text-center text-base ${PRESETS.includes(days) ? "border-border" : "border-accent"}`}
          />
        </Form>
      </div>
      <Link href={`/movimientos?dias=${days}`} className="flex items-end justify-between">
        <span>
          <span className="block text-2xl font-semibold tabular-nums">{formatMoney(total)}</span>
          <span className="text-xs text-muted">
            {days} días · {count} {count === 1 ? "gasto" : "gastos"} · {formatMoney(total / days)} al día
          </span>
        </span>
        <span className="text-sm text-accent">Ver ›</span>
      </Link>
    </section>
  );
}
