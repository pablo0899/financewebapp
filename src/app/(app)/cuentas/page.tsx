import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { AccountCard } from "@/features/accounts/components/AccountCard";
import { AccountForm } from "@/features/accounts/components/AccountForm";
import { AccountsSummary } from "@/features/accounts/components/AccountsSummary";
import { getAccountsOverview } from "@/features/accounts/queries";

export default function CuentasPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Cuentas</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Cuentas />
      </Suspense>
    </>
  );
}

async function Cuentas() {
  const { items, liquidity, debt, net } = await getAccountsOverview();

  return (
    <>
      <AccountsSummary liquidity={liquidity} debt={debt} net={net} />
      {items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {items.map((item) => (
            <AccountCard key={item.account.id} {...item} />
          ))}
        </ul>
      )}
      <AccountForm />
      <Link href="/ahorro" className="rounded-xl bg-surface p-4 text-center text-sm text-accent">
        🐷 Ver mis metas de ahorro
      </Link>
    </>
  );
}
