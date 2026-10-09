"use client";

import { useActionState } from "react";
import type { AccountKind } from "@/lib/supabase/database.types";
import { reconcileAccount, type AccountFormState } from "../actions";

/** "Ajustar saldo": capturas el saldo (o deuda) real y se registra la diferencia. */
export function ReconcileForm({ accountId, kind }: { accountId: string; kind: AccountKind }) {
  const [state, action, pending] = useActionState<AccountFormState, FormData>(reconcileAccount, {});

  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl bg-surface p-4">
      <h2 className="font-medium">Ajustar saldo</h2>
      <p className="text-sm text-muted">
        {kind === "credit"
          ? "Escribe la deuda que te muestra la app de tu tarjeta. La diferencia se registra como ajuste."
          : kind === "yield"
            ? "Escribe el saldo que te muestra la app. La diferencia (normalmente tus rendimientos) se registra y la estimación se reinicia desde hoy."
            : "Escribe el saldo que te muestra tu banco. La diferencia se registra como ajuste."}
      </p>
      <input type="hidden" name="id" value={accountId} />
      <div className="flex gap-2">
        <input
          name="real_balance"
          required
          inputMode="decimal"
          placeholder={kind === "credit" ? "Deuda real" : "Saldo real"}
          className="min-w-0 flex-1 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent"
        />
        <button disabled={pending} className="rounded-xl bg-accent px-4 font-medium text-white disabled:opacity-60">
          {pending ? "…" : "Ajustar"}
        </button>
      </div>
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      {state.message && <p className="text-sm text-income">{state.message}</p>}
    </form>
  );
}
