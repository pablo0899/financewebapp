"use client";

import { useActionState, useState } from "react";
import type { Category, MovementKind } from "@/lib/supabase/database.types";
import { createTransaction, type FormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";

export function TransactionForm({ categories, defaultDate }: { categories: Category[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTransaction, {});
  const [kind, setKind] = useState<MovementKind>("expense");
  const options = categories.filter((c) => c.kind === kind);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg py-2 font-medium ${kind === k ? (k === "expense" ? "bg-expense text-white" : "bg-income text-white") : "text-muted"}`}
          >
            {k === "expense" ? "Gasto" : "Ingreso"}
          </button>
        ))}
      </div>

      <input
        name="amount"
        required
        inputMode="decimal"
        placeholder="$0.00"
        autoFocus
        className="w-full bg-transparent py-4 text-center text-5xl font-semibold outline-none"
      />

      <div className="grid grid-cols-4 gap-2">
        {options.map((c, i) => (
          <label key={c.id} className="cursor-pointer">
            <input type="radio" name="category_id" value={c.id} defaultChecked={i === 0} className="peer sr-only" />
            <span className="flex flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2 text-center text-[11px] leading-tight peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/40">
              <span className="text-2xl">{c.icon}</span>
              {c.name}
            </span>
          </label>
        ))}
      </div>

      <input name="occurred_on" type="date" required defaultValue={defaultDate} className={field} />
      <input name="note" maxLength={200} placeholder="Nota (opcional)" className={field} />

      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
