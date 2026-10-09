import Link from "next/link";
import { formatMoney } from "@/lib/format";

/** Liquidez, deuda en tarjetas y saldo real (liquidez − deuda). */
export function AccountsSummary({ liquidity, debt, net, href }: { liquidity: number; debt: number; net: number; href?: string }) {
  const body = (
    <div className="grid grid-cols-3 gap-2 rounded-xl bg-surface p-3 text-center">
      <Stat label="Liquidez" value={formatMoney(liquidity)} />
      <Stat label="Deuda tarjetas" value={debt > 0 ? `−${formatMoney(debt)}` : formatMoney(0)} tone={debt > 0 ? "text-expense" : ""} />
      <Stat label="Saldo real" value={formatMoney(net)} tone={net < 0 ? "text-expense" : ""} strong />
    </div>
  );
  return href ? <Link href={href}>{body}</Link> : body;
}

function Stat({ label, value, tone = "", strong }: { label: string; value: string; tone?: string; strong?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-muted">{label}</p>
      <p className={`truncate tabular-nums ${strong ? "font-semibold" : "font-medium"} ${tone}`}>{value}</p>
    </div>
  );
}
