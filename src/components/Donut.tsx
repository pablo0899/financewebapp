import type { ReactNode } from "react";

const SIZE = 112;
const STROKE = 12;
const R = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * R;

/**
 * Anillo de progreso: `value` de `max`. Si se pasa del máximo y `alertOnOverflow`
 * está activo, el anillo se llena en rojo. El contenido central lo decide quien lo usa.
 */
export function Donut({
  value,
  max,
  color,
  label,
  alertOnOverflow = true,
  children,
}: {
  value: number;
  max: number;
  color: string;
  label: string;
  alertOnOverflow?: boolean;
  children?: ReactNode;
}) {
  const over = alertOnOverflow && value > max;
  const ratio = max > 0 ? Math.min(1, value / max) : 0;
  const arc = ratio * CIRCUMFERENCE;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        {arc > 0 && (
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={R}
            fill="none"
            stroke={over ? "var(--expense)" : color}
            strokeWidth={STROKE}
            strokeLinecap={ratio < 1 ? "round" : "butt"}
            strokeDasharray={`${arc} ${CIRCUMFERENCE}`}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
