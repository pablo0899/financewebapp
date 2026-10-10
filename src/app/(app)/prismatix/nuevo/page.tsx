import Link from "next/link";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { BizEntryForm } from "@/features/business/components/BizEntryForm";
import { NoBusiness } from "@/features/business/components/NoBusiness";
import { getBizLookups, getBusiness } from "@/features/business/queries";
import { today } from "@/lib/dates";

export default function PrismatixNuevoPage() {
  return (
    <>
      <header className="flex items-center gap-3">
        <Link href="/prismatix" className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold">Nuevo · Prismatix</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Form />
      </Suspense>
    </>
  );
}

async function Form() {
  const biz = await getBusiness();
  if (!biz) return <NoBusiness />;
  const lookups = await getBizLookups(biz.id);
  return <BizEntryForm {...lookups} myMemberId={biz.memberId} defaultDate={today()} />;
}
