"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isISODate, parseAmount } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
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

  const { supabase } = await requireUser();

  if (kind === "transfer") {
    if (!accountId || !toAccountId) return { error: "Elige la cuenta de origen y la de destino." };
    if (accountId === toAccountId) return { error: "El origen y el destino deben ser distintos." };
    const { error } = await supabase
      .from("transactions")
      .insert({ kind, amount, account_id: accountId, to_account_id: toAccountId, occurred_on: occurredOn, note });
    if (error) return { error: "No se pudo guardar. Intenta de nuevo." };
    // El pago desde la pantalla de una tarjeta regresa a esa misma pantalla.
    const returnTo = String(formData.get("return_to") ?? "");
    redirect(/^\/cuentas\/[\w-]+$/.test(returnTo) ? returnTo : "/cuentas");
  }

  if (!accountId) return { error: "Elige con qué cuenta pagaste o dónde cayó el dinero." };
  if (!categoryId) return { error: "Elige una categoría." };
  const { error } = await supabase
    .from("transactions")
    .insert({ kind, amount, account_id: accountId, category_id: categoryId, occurred_on: occurredOn, note });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect(`/?mes=${occurredOn.slice(0, 7)}`);
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
