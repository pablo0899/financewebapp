import { Suspense } from "react";
import { ConfirmButton } from "@/components/ConfirmButton";
import { Skeleton } from "@/components/Skeleton";
import { deleteReimbursement } from "@/features/business/actions";
import { ReimburseForm } from "@/features/business/components/CatalogForms";
import { NoBusiness } from "@/features/business/components/NoBusiness";
import { getBizBalances, getBusiness } from "@/features/business/queries";
import { today } from "@/lib/dates";
import { formatDay, formatMoney } from "@/lib/format";

export default function SociosPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Socios</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Socios />
      </Suspense>
    </>
  );
}

async function Socios() {
  const biz = await getBusiness();
  if (!biz) return <NoBusiness />;
  const { owed, cash, reimbursements, members } = await getBizBalances(biz.id);
  const defaultDate = today();
  const name = (id: string) => members.find((m) => m.id === id)?.display_name ?? "?";

  return (
    <>
      <section className="rounded-2xl bg-accent p-5 text-white">
        <p className="text-sm opacity-80">Caja del negocio</p>
        <p className="text-3xl font-semibold tabular-nums">{formatMoney(cash)}</p>
        <p className="text-xs opacity-80">Ventas netas − gastos pagados por el negocio − reembolsos (histórico)</p>
      </section>

      {owed.map(({ member, fronted, reimbursed, owed: debt }) => (
        <section key={member.id} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
          <div className="flex items-center gap-2">
            <span className="size-3 rounded-full" style={{ backgroundColor: member.color }} />
            <h2 className="flex-1 font-medium">{member.display_name}</h2>
            <span className="text-xs text-muted">{member.user_id ? "Con acceso a la app" : "Sin acceso a la app"}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center text-sm">
            <div>
              <p className="text-xs text-muted">Puso de su bolsa</p>
              <p className="font-medium tabular-nums">{formatMoney(fronted)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Reembolsado</p>
              <p className="font-medium tabular-nums">{formatMoney(reimbursed)}</p>
            </div>
            <div>
              <p className="text-xs text-muted">Se le debe</p>
              <p className={`font-semibold tabular-nums ${debt > 0 ? "text-chart-expense" : ""}`}>{formatMoney(debt)}</p>
            </div>
          </div>
          {debt > 0 && <ReimburseForm memberId={member.id} name={member.display_name} owed={debt} defaultDate={defaultDate} />}
        </section>
      ))}

      {reimbursements.length > 0 && (
        <section className="rounded-xl bg-surface p-4">
          <h2 className="mb-2 font-medium">Reembolsos</h2>
          <ul className="divide-y divide-border text-sm">
            {reimbursements.map((r) => (
              <li key={r.id} className="flex items-center gap-2 py-2">
                <span className="flex-1">
                  {name(r.member_id)} <span className="text-muted">· {formatDay(r.occurred_on)}</span>
                </span>
                <span className="tabular-nums">{formatMoney(Number(r.amount))}</span>
                <form action={deleteReimbursement.bind(null, r.id)}>
                  <ConfirmButton message="¿Borrar este reembolso?" label="Borrar reembolso" />
                </form>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
