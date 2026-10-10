"use client";

import { useState } from "react";
import { formatMoney, formatMonth } from "@/lib/format";

type Point = { month: string; income: number; expense: number };

const W = 320;
const H = 140;
const BASE = H - 18; // espacio abajo para el nombre del mes
const TOP = 8;
const SERIES = [
  { key: "income", label: "Ingresos", color: "var(--chart-income)" },
  { key: "expense", label: "Gastos", color: "var(--chart-expense)" },
] as const;

/** Barra con esquinas superiores redondeadas, apoyada en la línea base. */
function bar(x: number, w: number, h: number) {
  if (h <= 0) return "";
  const r = Math.min(4, w / 2, h);
  const y = BASE - h;
  return `M${x},${BASE} V${y + r} Q${x},${y} ${x + r},${y} H${x + w - r} Q${x + w},${y} ${x + w},${y + r} V${BASE} Z`;
}

/** Ingresos vs. gastos por mes. Tocar un mes muestra sus cifras exactas. */
export function TrendChart({ points }: { points: Point[] }) {
  const [selected, setSelected] = useState(points.length - 1);
  const max = Math.max(1, ...points.flatMap((p) => [p.income, p.expense]));
  const slot = W / points.length;
  const barW = Math.min(18, (slot - 14) / 2);
  const scale = (v: number) => (v / max) * (BASE - TOP);
  const sel = points[selected];

  return (
    <section className="rounded-xl bg-surface p-4">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-medium">Últimos 6 meses</h2>
        <div className="flex gap-3 text-xs text-muted">
          {SERIES.map((s) => (
            <span key={s.key} className="flex items-center gap-1">
              <span className="size-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>

      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Ingresos y gastos de los últimos 6 meses">
        <line x1={0} x2={W} y1={BASE} y2={BASE} stroke="var(--border)" />
        {points.map((p, i) => {
          const cx = i * slot + slot / 2;
          const active = i === selected;
          return (
            <g key={p.month} onClick={() => setSelected(i)} className="cursor-pointer" opacity={active ? 1 : 0.55}>
              {/* Zona de toque más grande que las barras */}
              <rect x={i * slot} y={0} width={slot} height={H} fill="transparent" />
              <path d={bar(cx - barW - 1, barW, scale(p.income))} fill={SERIES[0].color} />
              <path d={bar(cx + 1, barW, scale(p.expense))} fill={SERIES[1].color} />
              <text
                x={cx}
                y={H - 4}
                textAnchor="middle"
                fontSize={11}
                fill={active ? "var(--foreground)" : "var(--muted)"}
                fontWeight={active ? 600 : 400}
              >
                {formatMonth(p.month).slice(0, 3)}
              </text>
              <title>{`${formatMonth(p.month)}: ingresos ${formatMoney(p.income)}, gastos ${formatMoney(p.expense)}`}</title>
            </g>
          );
        })}
      </svg>

      <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg bg-background p-2 text-center text-xs">
        <div>
          <p className="text-muted capitalize">{formatMonth(sel.month)}</p>
        </div>
        <div>
          <p className="text-muted">Ingresos</p>
          <p className="font-medium tabular-nums">{formatMoney(sel.income)}</p>
        </div>
        <div>
          <p className="text-muted">Gastos</p>
          <p className="font-medium tabular-nums">{formatMoney(sel.expense)}</p>
        </div>
      </div>
    </section>
  );
}
