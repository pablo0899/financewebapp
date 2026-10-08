"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isISODate, parseAmount } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const kind = formData.get("kind");
  const amount = parseAmount(formData.get("amount"));
  const categoryId = String(formData.get("category_id") ?? "");
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (kind !== "income" && kind !== "expense") return { error: "Tipo inválido." };
  if (amount === null) return { error: "Escribe un monto mayor a 0." };
  if (!categoryId) return { error: "Elige una categoría." };
  if (!isISODate(occurredOn)) return { error: "Elige una fecha." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").insert({
    kind,
    amount,
    category_id: categoryId,
    occurred_on: occurredOn,
    note,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect(`/?mes=${occurredOn.slice(0, 7)}`);
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id);
  refresh();
}
