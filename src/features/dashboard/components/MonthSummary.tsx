import Link from "next/link";
import { formatMoney } from "@/lib/format";

type Props = { income: number; expense: number; saved: number; unidentified: number; available: number };

export function MonthSummary({ income, expense, saved, unidentified, available }: Props) {
  return (
    <div className="rounded-2xl bg-accent p-5 text-white">
      <p className="text-sm opacity-80">Disponible este mes</p>
      <p className="mb-4 text-3xl font-semibold tabular-nums">{formatMoney(available)}</p>
      <div className="grid grid-cols-3 gap-2 text-sm">
        <Stat label="Ingresos" value={income} />
        <Stat label="Gastos" value={expense} />
        <Link href="/ahorro">
          <Stat label="Ahorro ›" value={saved} />
        </Link>
      </div>
      {unidentified > 0 && (
        <p className="mt-3 text-sm opacity-80">
          Incluye {formatMoney(unidentified)} de egresos sin identificar (ajustes de saldo).
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="min-w-0 rounded-xl bg-white/15 p-2.5">
      <p className="opacity-80">{label}</p>
      <p className="truncate font-semibold tabular-nums">{formatMoney(value)}</p>
    </div>
  );
}
