import { formatMoney } from "@/lib/format";

export type BarRow = { key: string; label: string; icon?: string; color?: string; value: number; detail?: string };

/**
 * Barras horizontales relativas al valor mayor, con etiqueta y monto directos
 * (sin leyenda). Sin `color` usa el color de acento.
 */
export function BarList({ title, rows, empty }: { title: string; rows: BarRow[]; empty?: string }) {
  const max = Math.max(0, ...rows.map((r) => r.value));
  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <section className="rounded-xl bg-surface p-4">
      <h2 className="mb-3 font-medium">{title}</h2>
      {rows.length === 0 ? (
        <p className="py-2 text-center text-sm text-muted">{empty ?? "Sin datos este mes."}</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {rows.map((r) => (
            <li key={r.key}>
              <div className="mb-1 flex justify-between gap-2 text-sm">
                <span className="min-w-0 truncate">
                  {r.icon && `${r.icon} `}
                  {r.label}
                </span>
                <span className="shrink-0 tabular-nums text-muted">
                  {formatMoney(r.value)}
                  {total > 0 && ` · ${Math.round((r.value / total) * 100)}%`}
                  {r.detail && ` · ${r.detail}`}
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-border">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${max > 0 ? (r.value / max) * 100 : 0}%`, backgroundColor: r.color ?? "var(--accent)" }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
