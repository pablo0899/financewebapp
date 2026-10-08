"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/server";

export type FormState = { error?: string };

export async function createTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const kind = formData.get("kind");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const categoryId = String(formData.get("category_id") ?? "") || null;
  const occurredOn = String(formData.get("occurred_on") ?? "");
  const note = String(formData.get("note") ?? "").trim() || null;

  if (kind !== "income" && kind !== "expense") return { error: "Tipo inválido." };
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Escribe un monto mayor a 0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(occurredOn)) return { error: "Fecha inválida." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("transactions").insert({
    kind,
    amount: Math.round(amount * 100) / 100,
    category_id: categoryId,
    occurred_on: occurredOn,
    note,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };

  redirect(`/movimientos?mes=${occurredOn.slice(0, 7)}`);
}

export async function deleteTransaction(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("transactions").delete().eq("id", id);
  refresh();
}
