"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Category, MovementKind } from "@/lib/supabase/database.types";
import { createTransaction, type FormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";

export function TransactionForm({ categories, defaultDate }: { categories: Category[]; defaultDate: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTransaction, {});
  // Campos controlados: React limpia los formularios tras cada envío y así no
  // se pierde lo capturado cuando el servidor regresa un error.
  const [kind, setKind] = useState<MovementKind>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const options = categories.filter((c) => c.kind === kind);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        {(["expense", "income"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setCategoryId("");
            }}
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
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="w-full bg-transparent py-4 text-center text-5xl font-semibold outline-none"
      />

      <fieldset>
        <legend className="mb-2 text-sm font-medium">Categoría</legend>
        <div className="grid grid-cols-4 gap-2">
          {options.map((c) => (
            <label key={c.id} className="cursor-pointer">
              <input
                type="radio"
                name="category_id"
                value={c.id}
                required
                checked={categoryId === c.id}
                onChange={() => setCategoryId(c.id)}
                className="peer sr-only"
              />
              <span className="flex h-full flex-col items-center gap-1 rounded-xl border border-border bg-surface p-2 text-center text-[11px] leading-tight peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/40">
                <span className="text-2xl">{c.icon}</span>
                {c.name}
              </span>
            </label>
          ))}
          <Link
            href="/presupuestos#nueva-categoria"
            className="flex flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border p-2 text-center text-[11px] text-muted"
          >
            <span className="text-2xl">＋</span>
            Nueva
          </Link>
        </div>
      </fieldset>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fecha</span>
        <input name="occurred_on" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <input name="note" maxLength={200} placeholder="Nota (opcional)" value={note} onChange={(e) => setNote(e.target.value)} className={field} />

      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}
