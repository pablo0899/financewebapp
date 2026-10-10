import Link from "next/link";
import { Suspense } from "react";
import { BarList } from "@/components/charts/BarList";
import { TrendChart } from "@/components/charts/TrendChart";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { signOut } from "@/features/auth/actions";
import { MemberSpendDonut } from "@/features/business/components/MemberSpendDonut";
import { NoBusiness } from "@/features/business/components/NoBusiness";
import { ProfitCard } from "@/features/business/components/ProfitCard";
import { getBizBalances, getBizSummary, getBusiness } from "@/features/business/queries";
import { requestMonth } from "@/lib/dates";
import { formatMoney } from "@/lib/format";

export default function PrismatixPage({ searchParams }: PageProps<"/prismatix">) {
  return (
    <>
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Prismatix</h1>
        <form action={signOut}>
          <button className="text-sm text-muted">Salir</button>
        </form>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Resumen searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Resumen({ searchParams }: Pick<PageProps<"/prismatix">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const biz = await getBusiness();
  if (!biz) return <NoBusiness />;
  const [s, balances] = await Promise.all([getBizSummary(biz.id, month), getBizBalances(biz.id)]);
  const owed = balances.owed.filter((o) => o.owed > 0);

  return (
    <>
      <MonthPicker month={month} basePath="/prismatix" />
      <ProfitCard {...s} />

      <Link href="/prismatix/socios" className="grid grid-cols-2 gap-2 rounded-xl bg-surface p-3 text-center">
        <div>
          <p className="text-xs text-muted">Caja del negocio</p>
          <p className={`font-semibold tabular-nums ${balances.cash < 0 ? "text-expense" : ""}`}>{formatMoney(balances.cash)}</p>
        </div>
        <div>
          <p className="text-xs text-muted">Por reembolsar a socios</p>
          <p className="font-semibold tabular-nums">
            {owed.length === 0 ? "✓ Nada" : owed.map((o) => `${o.member.display_name} ${formatMoney(o.owed)}`).join(" · ")}
          </p>
        </div>
      </Link>

      <MemberSpendDonut segments={s.byMember} />
      <BarList title="Gastos por categoría" rows={s.byCategory} empty="Sin gastos este mes." />
      <BarList
        title="Ventas por artículo (neto)"
        rows={s.byItem.map(({ count, ...r }) => ({ ...r, detail: `${count} pza${count === 1 ? "" : "s"}` }))}
        empty="Sin ventas este mes."
      />
      <BarList title="Ventas por canal (neto)" rows={s.byChannel} empty="Sin ventas este mes." />
      <TrendChart points={s.trend} />
    </>
  );
}
