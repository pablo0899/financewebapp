import { Suspense } from "react";
import { MonthPicker } from "@/components/MonthPicker";
import { Skeleton } from "@/components/Skeleton";
import { BizMovementList } from "@/features/business/components/BizMovementList";
import { NoBusiness } from "@/features/business/components/NoBusiness";
import { getBizMonth, getBusiness } from "@/features/business/queries";
import { requestMonth } from "@/lib/dates";

export default function PrismatixMovimientosPage({ searchParams }: PageProps<"/prismatix/movimientos">) {
  return (
    <>
      <h1 className="text-2xl font-semibold">Movimientos · Prismatix</h1>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Movimientos searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Movimientos({ searchParams }: Pick<PageProps<"/prismatix/movimientos">, "searchParams">) {
  const month = await requestMonth(searchParams);
  const biz = await getBusiness();
  if (!biz) return <NoBusiness />;
  const { expenses, sales } = await getBizMonth(biz.id, month);
  return (
    <>
      <MonthPicker month={month} basePath="/prismatix/movimientos" />
      <BizMovementList expenses={expenses} sales={sales} />
    </>
  );
}
