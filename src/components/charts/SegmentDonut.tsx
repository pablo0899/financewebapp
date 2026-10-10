import type { ReactNode } from "react";

const SIZE = 120;
const STROKE = 14;
const R = (SIZE - STROKE) / 2;
const C = 2 * Math.PI * R;
const GAP = 2; // separación entre segmentos, en px del trazo

export type Segment = { key: string; label: string; value: number; color: string };

/**
 * Anillo con varios segmentos (partes de un total), separados por un hueco
 * para que se distingan sin depender solo del color. La leyenda (con valores)
 * la pone quien lo usa.
 */
export function SegmentDonut({ segments, label, children }: { segments: Segment[]; label: string; children?: ReactNode }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const visible = segments.filter((s) => s.value > 0);
  const gap = visible.length > 1 ? GAP : 0;
  let offset = 0;

  return (
    <div className="relative size-30 shrink-0">
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="size-full -rotate-90" role="img" aria-label={label}>
        <title>{label}</title>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={R} fill="none" stroke="var(--border)" strokeWidth={STROKE} />
        {total > 0 &&
          visible.map((s) => {
            const len = (s.value / total) * C;
            const dash = Math.max(0, len - gap);
            const el = (
              <circle
                key={s.key}
                cx={SIZE / 2}
                cy={SIZE / 2}
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth={STROKE}
                strokeDasharray={`${dash} ${C - dash}`}
                strokeDashoffset={-offset}
              >
                <title>{s.label}</title>
              </circle>
            );
            offset += len;
            return el;
          })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  );
}
