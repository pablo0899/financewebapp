"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isISODate, parseAmount } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string };

/** Valor de `to_account_id` en el formulario para una transferencia a una cuenta externa. */
const EXTERNAL = "external";

type TransactionFields = {
  kind: "income" | "expense" | "transfer";
  external: boolean;
  amount: number;
  account_id: string;
  to_account_id: string | null;
  category_id: string | null;
  occurred_on: string;
  note: string | null;
};

/** Valida el formulario de movimiento (alta y edición) y lo convierte en la fila a guardar. */
function readTransaction(formData: FormData): { error: string } | { fields: TransactionFields } {
  const kind = formData.get("kind");
  const amount = parseAmount(formData.get("amount"));
  const accountId = String(formData.get("account_id") ?? "");
  const toAccountId = String(formData.get("to_account_id") ?? "");
  const categoryId = String(formData.get("category_id") ?? "");
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (kind !== "income" && kind !== "expense" && kind !== "transfer") return { error: "Tipo inválido." };
  if (amount === null) return { error: "Escribe un monto mayor a 0." };
  if (!isISODate(occurredOn)) return { error: "Elige una fecha." };
  const base = { amount, occurred_on: occurredOn, note, external: false, to_account_id: null, category_id: null };

  // A una cuenta externa el dinero sale: se guarda como gasto (categoría opcional).
  if (kind === "transfer" && toAccountId === EXTERNAL) {
    if (!accountId) return { error: "Elige la cuenta de origen." };
    return { fields: { ...base, kind: "expense", external: true, account_id: accountId, category_id: categoryId || null } };
  }

  if (kind === "transfer") {
    if (!accountId || !toAccountId) return { error: "Elige la cuenta de origen y la de destino." };
    if (accountId === toAccountId) return { error: "El origen y el destino deben ser distintos." };
    return { fields: { ...base, kind, account_id: accountId, to_account_id: toAccountId } };
  }

  if (!accountId) return { error: "Elige con qué cuenta pagaste o dónde cayó el dinero." };
  if (!categoryId) return { error: "Elige una categoría." };
  return { fields: { ...base, kind, account_id: accountId, category_id: categoryId } };
}

/** `path` si es una ruta interna de la app (para regresar tras guardar), o `fallback`. */
function safePath(path: string, fallback: string) {
  return path.startsWith("/") && !path.startsWith("//") && !path.includes("\\") ? path : fallback;
}

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const result = readTransaction(formData);
  if ("error" in result) return result;
  const { fields } = result;

  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").insert(fields);
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  if (fields.kind === "transfer") {
    // El pago desde la pantalla de una tarjeta regresa a esa misma pantalla.
    const returnTo = String(formData.get("return_to") ?? "");
    redirect(/^\/cuentas\/[\w-]+$/.test(returnTo) ? returnTo : "/cuentas");
  }
  redirect(`/?mes=${fields.occurred_on.slice(0, 7)}`);
}

/**
 * Reemplaza un movimiento con lo capturado (monto, cuenta, categoría, tipo…).
 * Saldos, presupuestos y totales se calculan de los movimientos, así que se
 * actualizan solos. Los ajustes de saldo no se editan.
 */
export async function updateTransaction(id: string, _prev: FormState, formData: FormData): Promise<FormState> {
  const result = readTransaction(formData);
  if ("error" in result) return result;
  const { fields } = result;

  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .update(fields)
    .eq("id", id)
    .neq("kind", "adjustment")
    .select("id");
  if (error || data.length === 0) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect(safePath(String(formData.get("return_to") ?? ""), `/movimientos?mes=${fields.occurred_on.slice(0, 7)}`));
}

/** Cambia la cuenta de un gasto o ingreso (vacío = sin cuenta). */
export async function setTransactionAccount(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const accountId = String(formData.get("account_id") ?? "") || null;
  if (!id) return;
  const { supabase } = await requireUser();
  await supabase.from("transactions").update({ account_id: accountId }).eq("id", id).in("kind", ["income", "expense"]);
  refresh();
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id);
  refresh();
}

/** Borra desde la pantalla de edición y regresa a `returnTo`. */
export async function deleteTransactionAndReturn(id: string, returnTo: string) {
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id);
  redirect(safePath(returnTo, "/movimientos"));
}
