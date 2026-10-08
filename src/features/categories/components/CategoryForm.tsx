"use client";

import { useActionState, useState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { createCategory, type CategoryFormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export function CategoryForm() {
  const [state, action, pending] = useActionState<CategoryFormState, FormData>(createCategory, {});
  const [kind, setKind] = useState<"expense" | "income">("expense");

  return (
    <form action={action} id="nueva-categoria" className="flex scroll-mt-4 flex-col gap-3 rounded-xl bg-surface p-4">
      <h2 className="font-medium">Nueva categoría</h2>
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-1 rounded-lg bg-background p-1 text-sm">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-md py-1.5 ${kind === k ? "bg-surface font-medium shadow-sm" : "text-muted"}`}
          >
            {k === "expense" ? "De gasto" : "De ingreso"}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input name="icon" maxLength={4} placeholder="🛍️" aria-label="Emoji" className={`${field} w-16 text-center text-xl`} />
        <input name="name" required maxLength={40} placeholder="Nombre (ej. Ropa)" className={field} />
      </div>
      {kind === "expense" && (
        <input name="monthly_budget" inputMode="decimal" placeholder="Presupuesto mensual (opcional)" className={field} />
      )}
      <ColorPicker />
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-2.5 font-medium text-white disabled:opacity-60">
        {pending ? "Creando…" : "Crear categoría"}
      </button>
    </form>
  );
}
