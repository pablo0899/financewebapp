"use client";

import { useActionState, useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import type { Account, AccountKind } from "@/lib/supabase/database.types";
import { createAccount, updateAccount, type AccountFormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";
const KINDS: { kind: AccountKind; label: string }[] = [
  { kind: "credit", label: "Tarjeta crédito" },
  { kind: "yield", label: "Rendimiento" },
  { kind: "debit", label: "Débito" },
];

/** Alta de cuenta (sin `account`) o edición de su configuración (con `account`). */
export function AccountForm({ account }: { account?: Account }) {
  const editing = account !== undefined;
  const [state, action, pending] = useActionState<AccountFormState, FormData>(editing ? updateAccount : createAccount, {});
  const [kind, setKind] = useState<AccountKind>(account?.kind ?? "credit");

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      {!editing && <h2 className="font-medium">Nueva cuenta</h2>}
      {editing && <input type="hidden" name="id" value={account.id} />}
      <input type="hidden" name="kind" value={kind} />

      {!editing && (
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-background p-1 text-sm">
          {KINDS.map((k) => (
            <button
              key={k.kind}
              type="button"
              onClick={() => setKind(k.kind)}
              className={`rounded-md py-1.5 ${kind === k.kind ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
            >
              {k.label}
            </button>
          ))}
        </div>
      )}

      <div className="flex gap-2">
        <input
          name="icon"
          maxLength={4}
          defaultValue={account?.icon}
          placeholder={kind === "credit" ? "💳" : kind === "yield" ? "📈" : "🏦"}
          aria-label="Emoji"
          className={`${field} w-16 text-center text-xl`}
        />
        <input
          name="name"
          required
          maxLength={40}
          defaultValue={account?.name}
          placeholder={kind === "credit" ? "Ej. Amex" : kind === "yield" ? "Ej. Mercado Pago" : "Ej. BBVA"}
          className={field}
        />
      </div>

      {!editing && (
        <label className="flex flex-col gap-1 text-sm">
          {kind === "credit" ? "Deuda actual (lo que debes hoy)" : "Saldo actual"}
          <input name="balance" inputMode="decimal" placeholder="$0.00" className={field} />
        </label>
      )}

      {kind === "credit" && (
        <>
          <label className="flex flex-col gap-1 text-sm">
            Límite de crédito (opcional)
            <input name="credit_limit" inputMode="decimal" defaultValue={account?.credit_limit ?? ""} placeholder="$0.00" className={field} />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Día de corte
              <input name="statement_day" inputMode="numeric" defaultValue={account?.statement_day ?? ""} placeholder="Ej. 5" className={field} />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Día límite de pago
              <input name="due_day" inputMode="numeric" defaultValue={account?.due_day ?? ""} placeholder="Ej. 25" className={field} />
            </label>
          </div>
        </>
      )}

      {kind === "yield" && (
        <label className="flex flex-col gap-1 text-sm">
          Tasa anual (%)
          <input
            name="annual_rate"
            inputMode="decimal"
            defaultValue={account?.annual_rate != null ? Number(account.annual_rate) * 100 : ""}
            placeholder="Ej. 12"
            className={field}
          />
        </label>
      )}

      <ColorPicker defaultColor={account?.color} />
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      {state.message && <p className="text-sm text-income">{state.message}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-2.5 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : editing ? "Guardar cambios" : "Crear cuenta"}
      </button>
    </form>
  );
}
