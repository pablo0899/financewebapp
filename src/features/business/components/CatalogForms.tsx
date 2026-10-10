"use client";

import { useActionState } from "react";
import { ColorPicker } from "@/components/ColorPicker";
import { createBizCategory, createBizChannel, createBizItem, createReimbursement, type BizFormState } from "../actions";

const field = "min-w-0 rounded-xl border border-border bg-background px-3 py-2 outline-none focus:border-accent";
const button = "rounded-xl bg-accent px-4 py-2 font-medium text-white disabled:opacity-60";

function Feedback({ state }: { state: BizFormState }) {
  if (state.error) return <p className="text-sm text-expense">{state.error}</p>;
  if (state.message) return <p className="text-sm text-income">{state.message}</p>;
  return null;
}

export function ItemForm() {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createBizItem, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input name="icon" maxLength={4} placeholder="🔷" aria-label="Emoji" className={`${field} w-14 text-center`} />
        <input name="name" required maxLength={60} placeholder="Nombre del artículo" className={`${field} flex-1`} />
      </div>
      <div className="flex gap-2">
        <input name="price" inputMode="decimal" placeholder="Precio sugerido (opcional)" className={`${field} flex-1`} />
        <button disabled={pending} className={button}>Agregar</button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function BizCategoryForm() {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createBizCategory, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input name="icon" maxLength={4} placeholder="📦" aria-label="Emoji" className={`${field} w-14 text-center`} />
        <input name="name" required maxLength={40} placeholder="Nueva categoría" className={`${field} flex-1`} />
        <button disabled={pending} className={button}>Agregar</button>
      </div>
      <ColorPicker />
      <Feedback state={state} />
    </form>
  );
}

export function ChannelForm() {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createBizChannel, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input name="name" required maxLength={40} placeholder="Nuevo canal (ej. TikTok)" className={`${field} flex-1`} />
        <button disabled={pending} className={button}>Agregar</button>
      </div>
      <Feedback state={state} />
    </form>
  );
}

export function ReimburseForm({ memberId, name, owed, defaultDate }: { memberId: string; name: string; owed: number; defaultDate: string }) {
  const [state, action, pending] = useActionState<BizFormState, FormData>(createReimbursement, {});
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="member_id" value={memberId} />
      <div className="grid grid-cols-2 gap-2">
        <input name="amount" required inputMode="decimal" defaultValue={owed > 0 ? owed.toFixed(2) : ""} placeholder="$0.00" aria-label={`Monto a reembolsar a ${name}`} className={field} />
        <input name="occurred_on" type="date" required defaultValue={defaultDate} aria-label="Fecha" className={field} />
      </div>
      <button disabled={pending} className="rounded-xl bg-income py-2 font-medium text-white disabled:opacity-60">
        Registrar reembolso a {name}
      </button>
      <Feedback state={state} />
    </form>
  );
}
