"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { BizChannel, BizExpenseCategory, BizItem, BusinessMember } from "@/lib/supabase/database.types";
import { createBizExpense, createBizSale, type BizFormState } from "../actions";

const field = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";
const chip =
  "flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/40";
const amountInput = "w-full bg-transparent py-3 text-center text-5xl font-semibold outline-none";

type Props = {
  members: BusinessMember[];
  categories: BizExpenseCategory[];
  channels: BizChannel[];
  items: BizItem[];
  myMemberId: string;
  defaultDate: string;
};

/** Registrar un gasto o una venta de Prismatix. */
export function BizEntryForm(props: Props) {
  const [kind, setKind] = useState<"expense" | "sale">("expense");
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-surface p-1">
        {(["expense", "sale"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => setKind(k)}
            className={`rounded-lg py-2 font-medium ${kind === k ? (k === "expense" ? "bg-chart-expense text-white" : "bg-chart-income text-white") : "text-muted"}`}
          >
            {k === "expense" ? "Gasto" : "Venta"}
          </button>
        ))}
      </div>
      {kind === "expense" ? <ExpenseForm {...props} /> : <SaleForm {...props} />}
    </div>
  );
}

function ExpenseForm({ members, categories, myMemberId, defaultDate }: Props) {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createBizExpense, {});
  // Controlados para no perder lo capturado si el servidor regresa un error.
  const [f, setF] = useState({
    amount: "",
    spent_by: myMemberId,
    description: "",
    category_id: "",
    paid_with: "business",
    occurred_on: defaultDate,
  });
  const set = (k: keyof typeof f) => (v: string) => setF((p) => ({ ...p, [k]: v }));
  const spender = members.find((m) => m.id === f.spent_by)?.display_name ?? "quien gastó";

  return (
    <form action={action} className="flex flex-col gap-4">
      <input name="amount" required inputMode="decimal" placeholder="$0.00" autoFocus value={f.amount} onChange={(e) => set("amount")(e.target.value)} className={amountInput} />

      <Radios legend="¿Quién hizo el gasto?" name="spent_by" value={f.spent_by} onChange={set("spent_by")}
        options={members.map((m) => ({ value: m.id, label: m.display_name, dot: m.color }))} />

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">¿Qué se compró?</span>
        <input name="description" required maxLength={120} placeholder="Ej. 2 rollos de filamento PLA" value={f.description} onChange={(e) => set("description")(e.target.value)} className={field} />
      </label>

      <Radios legend="Categoría" name="category_id" value={f.category_id} onChange={set("category_id")}
        options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))} />

      <Radios legend="¿Con qué dinero se pagó?" name="paid_with" value={f.paid_with} onChange={set("paid_with")}
        options={[{ value: "business", label: "🔷 Del negocio" }, { value: "personal", label: `👛 De ${spender}` }]} />
      {f.paid_with === "personal" && (
        <p className="-mt-2 text-xs text-muted">Prismatix le deberá este monto a {spender} hasta que se le reembolse (ver Socios).</p>
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fecha</span>
        <input name="occurred_on" type="date" required value={f.occurred_on} onChange={(e) => set("occurred_on")(e.target.value)} className={field} />
      </label>

      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar gasto"}
      </button>
    </form>
  );
}

function SaleForm({ channels, items, defaultDate }: Props) {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createBizSale, {});
  const active = items.filter((i) => i.active);
  const [f, setF] = useState({ item_id: "", quantity: 1, amount: "", fees: "", channel_id: "", customer: "", note: "", occurred_on: defaultDate });
  // Mientras no se edite el monto a mano, se calcula con precio × cantidad.
  const [amountTouched, setAmountTouched] = useState(false);
  const set = <K extends keyof typeof f>(k: K) => (v: (typeof f)[K]) => setF((p) => ({ ...p, [k]: v }));

  const priceOf = (id: string) => Number(items.find((i) => i.id === id)?.price ?? 0);
  const suggested = (id: string, qty: number) => (priceOf(id) > 0 ? (priceOf(id) * qty).toFixed(2) : "");
  const pick = (id: string) => setF((p) => ({ ...p, item_id: id, amount: amountTouched ? p.amount : suggested(id, p.quantity) }));
  const qty = (q: number) => setF((p) => ({ ...p, quantity: q, amount: amountTouched ? p.amount : suggested(p.item_id, q) }));
  const netAmount = Number(f.amount || 0) - Number(f.fees || 0);

  if (active.length === 0) {
    return (
      <Link href="/prismatix/catalogo" className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
        Primero da de alta tus artículos en el Catálogo. Toca aquí.
      </Link>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <Radios legend="Artículo" name="item_id" value={f.item_id} onChange={pick}
        options={active.map((i) => ({ value: i.id, label: `${i.icon} ${i.name}` }))} />

      <div className="flex items-center justify-between rounded-xl bg-surface p-2">
        <span className="pl-2 text-sm font-medium">Cantidad</span>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => qty(Math.max(1, f.quantity - 1))} className="size-10 rounded-full bg-background text-xl" aria-label="Menos">−</button>
          <span className="w-8 text-center text-lg font-semibold tabular-nums">{f.quantity}</span>
          <button type="button" onClick={() => qty(f.quantity + 1)} className="size-10 rounded-full bg-background text-xl" aria-label="Más">+</button>
        </div>
        <input type="hidden" name="quantity" value={f.quantity} />
      </div>

      <label className="flex flex-col items-center">
        <span className="text-sm text-muted">Total cobrado</span>
        <input name="amount" required inputMode="decimal" placeholder="$0.00" value={f.amount}
          onChange={(e) => { setAmountTouched(true); set("amount")(e.target.value); }} className={amountInput} />
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Comisión y envío (opcional)</span>
        <input name="fees" inputMode="decimal" placeholder="$0.00" value={f.fees} onChange={(e) => set("fees")(e.target.value)} className={field} />
        {Number(f.fees) > 0 && <span className="text-xs text-muted">Ingreso neto: ${netAmount.toFixed(2)}</span>}
      </label>

      <Radios legend="Canal de venta" name="channel_id" value={f.channel_id} onChange={set("channel_id")}
        options={channels.map((c) => ({ value: c.id, label: c.name }))} />

      <input name="customer" maxLength={80} placeholder="Cliente (opcional)" value={f.customer} onChange={(e) => set("customer")(e.target.value)} className={field} />
      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fecha</span>
        <input name="occurred_on" type="date" required value={f.occurred_on} onChange={(e) => set("occurred_on")(e.target.value)} className={field} />
      </label>
      <input name="note" maxLength={200} placeholder="Nota (opcional)" value={f.note} onChange={(e) => set("note")(e.target.value)} className={field} />

      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar venta"}
      </button>
    </form>
  );
}

function Radios({
  legend,
  name,
  value,
  onChange,
  options,
}: {
  legend: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string; dot?: string }[];
}) {
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o.value} className="cursor-pointer">
            <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="peer sr-only" />
            <span className={chip}>
              {o.dot && <span className="size-2.5 rounded-full" style={{ backgroundColor: o.dot }} />}
              {o.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
