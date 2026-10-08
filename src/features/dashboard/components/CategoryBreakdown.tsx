import { ProgressBar } from "@/components/ProgressBar";
import { formatMoney } from "@/lib/format";

type Row = { name: string; icon: string; color: string; total: number };

/** Gasto por categoría, como barras relativas a la categoría mayor. */
export function CategoryBreakdown({ rows }: { rows: Row[] }) {
  if (rows.length === 0) return null;
  const max = rows[0].total;
  const total = rows.reduce((s, r) => s + r.total, 0);

  return (
    <section className="rounded-xl bg-surface p-4">
      <h2 className="mb-3 font-medium">Gastos por categoría</h2>
      <ul className="flex flex-col gap-3">
        {rows.map((r) => (
          <li key={r.name}>
            <div className="mb-1 flex justify-between text-sm">
              <span>
                {r.icon} {r.name}
              </span>
              <span className="tabular-nums text-muted">
                {formatMoney(r.total)} · {Math.round((r.total / total) * 100)}%
              </span>
            </div>
            <ProgressBar value={r.total} max={max} color={r.color} />
          </li>
        ))}
      </ul>
    </section>
  );
}
