"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import type { Account, Category } from "@/lib/supabase/database.types";
import { createTransaction, type FormState } from "../actions";

type Kind = "expense" | "income" | "transfer";

const KIND_LABEL: Record<Kind, string> = { expense: "Gasto", income: "Ingreso", transfer: "Transferencia" };
const KIND_ACTIVE: Record<Kind, string> = {
  expense: "bg-expense text-white",
  income: "bg-income text-white",
  transfer: "bg-accent text-white",
};
/** Valor de `to_account_id` para una transferencia a una cuenta externa (ver actions.ts). */
const EXTERNAL = "external";
const field = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";

export function TransactionForm({
  categories,
  accounts,
  defaultDate,
  defaultAccountId,
}: {
  categories: Category[];
  accounts: Account[];
  defaultDate: string;
  defaultAccountId: string | null;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(createTransaction, {});
  // Campos controlados: React limpia los formularios tras cada envío y así no
  // se pierde lo capturado cuando el servidor regresa un error.
  const [kind, setKind] = useState<Kind>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accountId, setAccountId] = useState(defaultAccountId ?? "");
  const [toAccountId, setToAccountId] = useState("");
  const [date, setDate] = useState(defaultDate);
  const [note, setNote] = useState("");
  const external = kind === "transfer" && toAccountId === EXTERNAL;
  // Las transferencias externas usan (opcionalmente) categorías de gasto.
  const options = categories.filter((c) => c.kind === (kind === "income" ? "income" : "expense"));

  if (accounts.length === 0) {
    return (
      <Link href="/cuentas" className="rounded-xl border border-dashed border-border p-6 text-center text-muted">
        Primero da de alta tus cuentas (tarjetas, Mercado Pago…). Toca aquí.
      </Link>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="kind" value={kind} />
      <div className="grid grid-cols-3 gap-1 rounded-xl bg-surface p-1 text-sm">
        {(["expense", "income", "transfer"] as const).map((k) => (
          <button
            key={k}
            type="button"
            onClick={() => {
              setKind(k);
              setCategoryId("");
            }}
            className={`rounded-lg py-2 font-medium ${kind === k ? KIND_ACTIVE[k] : "text-muted"}`}
          >
            {KIND_LABEL[k]}
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

      <AccountPicker
        name="account_id"
        legend={kind === "expense" ? "Pagado con" : kind === "income" ? "Cae en" : "Desde"}
        accounts={accounts}
        value={accountId}
        onChange={setAccountId}
      />

      {kind === "transfer" && (
        <>
          <AccountPicker
            name="to_account_id"
            legend="Hacia"
            accounts={accounts.filter((a) => a.id !== accountId)}
            value={toAccountId}
            onChange={(id) => {
              setToAccountId(id);
              setCategoryId("");
            }}
            extra={{ id: EXTERNAL, label: "↗️ Cuenta externa" }}
          />
          <p className="-mt-2 text-xs text-muted">
            {external
              ? "Dinero que sale a otra persona o a una cuenta que no está en la app: cuenta como egreso del mes."
              : "Para pagar una tarjeta: desde Mercado Pago hacia la tarjeta. No cuenta como gasto (el gasto ya se registró al comprar)."}
          </p>
        </>
      )}

      {(kind !== "transfer" || external) && (
        <fieldset>
          <legend className="mb-2 text-sm font-medium">
            Categoría{external && <span className="font-normal text-muted"> (opcional, para que cuente en un presupuesto)</span>}
          </legend>
          <div className="grid grid-cols-4 gap-2">
            {options.map((c) => (
              <label key={c.id} className="cursor-pointer">
                <input
                  type="radio"
                  name="category_id"
                  value={c.id}
                  required={!external}
                  checked={categoryId === c.id}
                  onChange={() => setCategoryId(c.id)}
                  onClick={() => external && categoryId === c.id && setCategoryId("")}
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
      )}

      <label className="flex flex-col gap-2">
        <span className="text-sm font-medium">Fecha</span>
        <input name="occurred_on" type="date" required value={date} onChange={(e) => setDate(e.target.value)} className={field} />
      </label>
      <input name="note" maxLength={200} placeholder={external ? "¿A quién? (opcional)" : "Nota (opcional)"} value={note} onChange={(e) => setNote(e.target.value)} className={field} />

      {state.error && <p className="text-sm text-expense">{state.error}</p>}
      <button disabled={pending} className="rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Guardando…" : "Guardar"}
      </button>
    </form>
  );
}

function AccountPicker({
  name,
  legend,
  accounts,
  value,
  onChange,
  extra,
}: {
  name: string;
  legend: string;
  accounts: Account[];
  value: string;
  onChange: (id: string) => void;
  /** Opción adicional que no es una cuenta (ej. "Cuenta externa"). */
  extra?: { id: string; label: string };
}) {
  const options = [...accounts.map((a) => ({ id: a.id, label: `${a.icon} ${a.name}` })), ...(extra ? [extra] : [])];
  return (
    <fieldset>
      <legend className="mb-2 text-sm font-medium">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((a) => (
          <label key={a.id} className="cursor-pointer">
            <input
              type="radio"
              name={name}
              value={a.id}
              required
              checked={value === a.id}
              onChange={() => onChange(a.id)}
              className="peer sr-only"
            />
            <span className="flex items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-sm peer-checked:border-accent peer-checked:ring-2 peer-checked:ring-accent/40">
              {a.label}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
