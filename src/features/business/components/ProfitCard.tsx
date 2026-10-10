import { formatMoney } from "@/lib/format";

type Props = { profit: number; margin: number | null; income: number; fees: number; spent: number; pieces: number };

/** Utilidad del mes (ingresos netos − gastos) con su desglose. */
export function ProfitCard({ profit, margin, income, fees, spent, pieces }: Props) {
  return (
    <div className="rounded-2xl bg-accent p-5 text-white">
      <p className="text-sm opacity-80">Utilidad del mes</p>
      <p className="text-3xl font-semibold tabular-nums">{formatMoney(profit)}</p>
      <p className="mb-4 text-sm opacity-80">{margin === null ? "Sin ventas este mes" : `Margen ${Math.round(margin * 100)}%`}</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Ventas netas" value={formatMoney(income)} />
        <Stat label="Gastos" value={formatMoney(spent)} />
        <Stat label="Piezas" value={String(pieces)} />
      </div>
      {fees > 0 && <p className="mt-2 text-xs opacity-80">Comisiones y envíos descontados: {formatMoney(fees)}</p>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/15 p-2.5">
      <p className="opacity-80">{label}</p>
      <p className="truncate font-semibold tabular-nums">{value}</p>
    </div>
  );
}
