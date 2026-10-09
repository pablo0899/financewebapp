"use client";

import { useActionState } from "react";
import { createTransaction, type FormState } from "@/features/transactions/actions";
import type { Account } from "@/lib/supabase/database.types";

const field = "min-w-0 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";

/** Pagar la tarjeta = transferencia desde otra cuenta. No cuenta como gasto. */
export function PayCardForm({
  cardId,
  sources,
  suggested,
  defaultDate,
}: {
  cardId: string;
  sources: Pick<Account, "id" | "name" | "icon">[];
  suggested: number;
  defaultDate: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTransaction, {});
  if (sources.length === 0) return null;

  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <h2 className="font-medium">Pagar tarjeta</h2>
      <input type="hidden" name="kind" value="transfer" />
      <input type="hidden" name="to_account_id" value={cardId} />
      <input type="hidden" name="return_to" value={`/cuentas/${cardId}`} />
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" required inputMode="decimal" defaultValue={suggested > 0 ? suggested.toFixed(2) : ""} placeholder="$0.00" aria-label="Monto" className={field} />
        <input name="occurred_on" type="date" required defaultValue={defaultDate} aria-label="Fecha" className={field} />
      </div>
      <select name="account_id" required defaultValue={sources[0].id} aria-label="Pagar desde" className={field}>
        {sources.map((a) => (
          <option key={a.id} value={a.id}>
            Desde {a.icon} {a.name}
          </option>
        ))}
      </select>
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-income py-2.5 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Registrar pago"}
      </button>
    </form>
  );
}
