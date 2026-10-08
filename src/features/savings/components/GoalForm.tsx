"use client";

import { useActionState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { PRESET_COLORS } from "@/lib/forms";
import { createGoal, type SavingsFormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";

export function GoalForm() {
  const [state, action, pending] = useActionState<SavingsFormState, FormData>(createGoal, {});

  return (
    <form action={action} className="flex flex-col gap-3 rounded-xl bg-surface p-4">
      <h2 className="font-medium">Nueva meta de ahorro</h2>
      <div className="flex gap-2">
        <input name="icon" maxLength={4} placeholder="🐷" aria-label="Emoji" className={`${field} w-16 text-center text-xl`} />
        <input name="name" required maxLength={40} placeholder="Nombre (ej. Fondo de emergencia)" className={field} />
      </div>
      <input name="target" inputMode="decimal" placeholder="Meta a alcanzar (opcional)" className={field} />
      <ColorPicker defaultColor={PRESET_COLORS[2]} />
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-2.5 font-medium text-white disabled:opacity-60">
        {pending ? "Creando…" : "Crear meta"}
      </button>
    </form>
  );
}
