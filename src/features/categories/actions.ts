"use server";

import { refresh } from "next/cache";
import { parseAmount, PRESET_COLORS } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";

export type CategoryFormState = { error?: string };

export async function createCategory(_prev: CategoryFormState, formData: FormData): Promise<CategoryFormState> {
  const name = String(formData.get("name") ?? "").trim();
  const icon = String(formData.get("icon") ?? "").trim() || "💸";
  const color = String(formData.get("color") ?? "");
  const kind = formData.get("kind") === "income" ? "income" : "expense";
  const budget = parseAmount(formData.get("monthly_budget"));

  if (!name || name.length > 40) return { error: "Escribe un nombre (máx. 40 caracteres)." };

  const { supabase } = await requireUser();
  const { error } = await supabase.from("categories").insert({
    name,
    icon: [...icon].slice(0, 2).join(""),
    color: PRESET_COLORS.includes(color) ? color : PRESET_COLORS[0],
    kind,
    monthly_budget: kind === "expense" ? budget : null,
  });
  if (error?.code === "23505") return { error: "Ya existe una categoría con ese nombre." };
  if (error) return { error: "No se pudo crear la categoría." };

  refresh();
  return {};
}

/** Los movimientos de la categoría se conservan y quedan "Sin categoría". */
export async function deleteCategory(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("categories").delete().eq("id", id);
  refresh();
}

/** Fija el presupuesto mensual de una categoría; vacío lo quita. */
export async function saveBudget(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  if (!categoryId) return;

  const { supabase } = await requireUser();
  await supabase
    .from("categories")
    .update({ monthly_budget: parseAmount(formData.get("amount")) })
    .eq("id", categoryId);
  refresh();
}
