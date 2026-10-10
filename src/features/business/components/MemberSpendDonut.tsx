import { SegmentDonut, type Segment } from "@/components/charts/SegmentDonut";
import { formatMoney } from "@/lib/format";

/** Gastos del mes por socio: anillo + leyenda con monto y porcentaje. */
export function MemberSpendDonut({ segments }: { segments: Segment[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const label = segments.map((s) => `${s.label} ${formatMoney(s.value)}`).join(", ");

  return (
    <section className="rounded-xl bg-surface p-4">
      <h2 className="mb-3 font-medium">Gastos por persona</h2>
      <div className="flex items-center gap-4">
        <SegmentDonut segments={segments} label={`Gastos por persona: ${label}`}>
          <span className="text-xs text-muted">Total</span>
          <span className="text-sm font-semibold tabular-nums">{formatMoney(total)}</span>
        </SegmentDonut>
        <ul className="flex min-w-0 flex-1 flex-col gap-3">
          {segments.map((s) => (
            <li key={s.key} className="flex items-start gap-2">
              <span className="mt-1.5 size-2.5 shrink-0 rounded-sm" style={{ backgroundColor: s.color }} />
              <div className="min-w-0">
                <p className="text-sm font-medium">{s.label}</p>
                <p className="text-sm tabular-nums text-muted">
                  {formatMoney(s.value)}
                  {total > 0 && ` · ${Math.round((s.value / total) * 100)}%`}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
