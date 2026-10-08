"use server";

import { refresh } from "next/cache";
import { isISODate, parseAmount, PRESET_COLORS } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export type SavingsFormState = { error?: string };

export async function createGoal(_prev: SavingsFormState, formData: FormData): Promise<SavingsFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "🐷";
  const color = String(formData.get("color") ?? "");
  if (!name || name.length > 40) return { error: "Escribe un nombre (máx. 40 caracteres)." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("savings_goals").insert({
    name,
    icon: [...icon].slice(0, 2).join(""),
    color: PRESET_COLORS.includes(color) ? color : PRESET_COLORS[2],
    target: parseAmount(formData.get("target")),
  });
  if (error) return { error: "No se pudo crear la meta." };

  refresh();
  return {};
}

/** Borra la meta y todo su historial de aportaciones. */
export async function deleteGoal(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("savings_goals").delete().eq("id", id);
  refresh();
}

/** Aporta (direction=deposit) o retira (direction=withdraw) dinero de una meta. */
export async function addSavingsMovement(_prev: SavingsFormState, formData: FormData): Promise<SavingsFormState> {
  const goalId = String(formData.get("goal_id") ?? "");
  const amount = parseAmount(formData.get("amount"));
  const withdraw = formData.get("direction") === "withdraw";
  const occurredOn = String(formData.get("occurred_on") ?? "");

  if (!goalId) return { error: "Meta inválida." };
  if (amount === null) return { error: "Escribe un monto mayor a 0." };
  if (!isISODate(occurredOn)) return { error: "Elige una fecha." };

  const { supabase } = await requireUser();

  if (withdraw) {
    const { data } = await supabase.from("savings_movements").select("amount").eq("goal_id", goalId);
    const balance = (data ?? []).reduce((s, m) => s + Number(m.amount), 0);
    if (amount > balance) return { error: "No puedes retirar más de lo ahorrado en esta meta." };
  }

  const { error } = await supabase.from("savings_movements").insert({
    goal_id: goalId,
    amount: withdraw ? -amount : amount,
    occurred_on: occurredOn,
    note: String(formData.get("note") ?? "").trim() || null,
  });
  if (error) return { error: "No se pudo guardar." };

  refresh();
  return {};
}

export async function deleteSavingsMovement(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("savings_movements").delete().eq("id", id);
  refresh();
}
