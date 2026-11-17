import Link from "next/link";
import { headers } from "next/headers";
import { Suspense } from "react";
import { Skeleton } from "@/components/Skeleton";
import { CaptureSetup } from "@/features/inbox/components/CaptureSetup";
import { InboxList } from "@/features/inbox/components/InboxList";
import { getIngestToken, getPendingInbox } from "@/features/inbox/queries";
import { LOCALE, TIMEZONE } from "@/lib/config";

export default function BandejaPage() {
  return (
    <>
      <header className="flex items-center gap-3">
        <Link href="/movimientos" className="text-2xl text-muted" aria-label="Volver">
          ‹
        </Link>
        <h1 className="text-2xl font-semibold">Por confirmar</h1>
      </header>
      <Suspense fallback={<Skeleton className="h-96" />}>
        <Bandeja />
      </Suspense>
    </>
  );
}

async function Bandeja() {
  const [items, token, h] = await Promise.all([getPendingInbox(), getIngestToken(), headers()]);
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  const lastUsed = token?.last_used_at
    ? new Intl.DateTimeFormat(LOCALE, { dateStyle: "medium", timeStyle: "short", timeZone: TIMEZONE }).format(
        new Date(token.last_used_at),
      )
    : null;

  return (
    <>
      <InboxList items={items} />
      <CaptureSetup endpoint={`${proto}://${host}/api/ingest`} status={token} lastUsedLabel={lastUsed} />
    </>
  );
}
