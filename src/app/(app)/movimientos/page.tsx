import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { TransactionList } from "@/features/transactions/components/TransactionList";
import { getMonthTransactions } from "@/features/transactions/queries";
import { requestMonth } from "@/lib/dates";

export default function MovimientosPage({ searchParams }: PageProps<"/movimientos">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Movimientos</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Movimientos searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Movimientos({ searchParams }: Pick<PageProps<"/movimientos">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const transactions = await getMonthTransactions(month);

  return (
    <>
      <MonthPicker month={month} basePath="/movimientos" />
      <TransactionList transactions={transactions} />
    </>
  );
}
