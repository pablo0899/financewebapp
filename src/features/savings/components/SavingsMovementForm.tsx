"use client";

import { useActionState } from "react";
import { addSavingsMovement, type SavingsFormState } from "../actions";

const field = "min-w-0 rounded-lg border border-border bg-background px-2 py-2 outline-none focus:border-accent";

/** Aportar o retirar de una meta: un monto, una fecha y dos botones. */
export function SavingsMovementForm({ goalId, defaultDate }: { goalId: string; defaultDate: string }) {
  const [state, action, pending] = useActionState<SavingsFormState, FormData>(addSavingsMovement, {});

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="goal_id" value={goalId} />
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" required inputMode="decimal" placeholder="$0.00" aria-label="Monto" className={field} />
        <input name="occurred_on" type="date" required defaultValue={defaultDate} aria-label="Fecha" className={field} />
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm font-medium">
        <button name="direction" value="deposit" disabled={pending} className="rounded-lg bg-income py-2 text-white disabled:opacity-60">
          + Aportar
        </button>
        <button name="direction" value="withdraw" disabled={pending} className="rounded-lg border border-border py-2 disabled:opacity-60">
          − Retirar
        </button>
      </div>
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
    </form>
  );
}
