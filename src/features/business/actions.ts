"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { isISODate, parseAmount, PRESET_COLORS } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";
import { getBusiness } from "./queries";

export type BizFormState = { error?: string; message?: string };

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
const icon = (value: string, fallback: string) => [...(value || fallback)].slice(0, 2).join("");

/** Negocio del usuario; corta la acción si no pertenece a ninguno. */
async function business() {
  const biz = await getBusiness();
  if (!biz) throw new Error("No perteneces a ningún negocio.");
  const { supabase } = await requireUser();
  return { biz, supabase };
}

// Gastos y ventas -----------------------------------------------------------

export async function createBizExpense(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const amount = parseAmount(formData.get("amount"));
  const spentBy = text(formData, "spent_by");
  const description = text(formData, "description");
  const occurredOn = text(formData, "occurred_on");
  const paidWith = formData.get("paid_with") === "personal" ? "personal" : "business";

  if (amount === null) return { error: "Escribe un monto mayor a 0." };
  if (!spentBy) return { error: "Elige quién hizo el gasto." };
  if (!description) return { error: "Escribe qué se compró." };
  if (!isISODate(occurredOn)) return { error: "Elige una fecha." };

  const { biz, supabase } = await business();
  const { error } = await supabase.from("biz_expenses").insert({
    business_id: biz.id,
    amount,
    spent_by: spentBy,
    description: description.slice(0, 120),
    category_id: text(formData, "category_id") || null,
    occurred_on: occurredOn,
    paid_with: paidWith,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };
  redirect(`/prismatix?mes=${occurredOn.slice(0, 7)}`);
}

export async function createBizSale(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const amount = parseAmount(formData.get("amount"));
  const fees = parseAmount(formData.get("fees")) ?? 0;
  const quantity = Number(formData.get("quantity"));
  const itemId = text(formData, "item_id");
  const occurredOn = text(formData, "occurred_on");

  if (!itemId) return { error: "Elige el artículo." };
  if (!Number.isInteger(quantity) || quantity < 1) return { error: "La cantidad debe ser al menos 1." };
  if (amount === null) return { error: "Escribe el monto cobrado." };
  if (fees > amount) return { error: "La comisión/envío no puede ser mayor al monto." };
  if (!isISODate(occurredOn)) return { error: "Elige una fecha." };

  const { biz, supabase } = await business();
  const { error } = await supabase.from("biz_sales").insert({
    business_id: biz.id,
    item_id: itemId,
    quantity,
    amount,
    fees,
    channel_id: text(formData, "channel_id") || null,
    customer: text(formData, "customer").slice(0, 80) || null,
    note: text(formData, "note").slice(0, 200) || null,
    occurred_on: occurredOn,
  });
  if (error) return { error: "No se pudo guardar. Intenta de nuevo." };
  redirect(`/prismatix?mes=${occurredOn.slice(0, 7)}`);
}

export async function deleteBizExpense(id: string) {
  const { supabase } = await business();
  await supabase.from("biz_expenses").delete().eq("id", id);
  refresh();
}

export async function deleteBizSale(id: string) {
  const { supabase } = await business();
  await supabase.from("biz_sales").delete().eq("id", id);
  refresh();
}

// Catálogo --------------------------------------------------------------------

export async function createBizItem(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const name = text(formData, "name");
  if (!name) return { error: "Escribe el nombre del artículo." };
  const { biz, supabase } = await business();
  const { error } = await supabase.from("biz_items").insert({
    business_id: biz.id,
    name: name.slice(0, 60),
    icon: icon(text(formData, "icon"), "🔷"),
    price: parseAmount(formData.get("price")),
  });
  if (error?.code === "23505") return { error: "Ya existe un artículo con ese nombre." };
  if (error) return { error: "No se pudo crear el artículo." };
  refresh();
  return {};
}

/** Actualiza el precio sugerido (vacío = sin precio). */
export async function updateBizItemPrice(formData: FormData) {
  const { supabase } = await business();
  await supabase.from("biz_items").update({ price: parseAmount(formData.get("price")) }).eq("id", text(formData, "id"));
  refresh();
}

/** Los artículos inactivos no aparecen al registrar ventas, pero conservan su historial. */
export async function toggleBizItem(id: string, active: boolean) {
  const { supabase } = await business();
  await supabase.from("biz_items").update({ active }).eq("id", id);
  refresh();
}

export async function createBizCategory(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const name = text(formData, "name");
  if (!name) return { error: "Escribe un nombre." };
  const color = text(formData, "color");
  const { biz, supabase } = await business();
  const { error } = await supabase.from("biz_expense_categories").insert({
    business_id: biz.id,
    name: name.slice(0, 40),
    icon: icon(text(formData, "icon"), "📦"),
    color: PRESET_COLORS.includes(color) ? color : PRESET_COLORS[8],
  });
  if (error?.code === "23505") return { error: "Ya existe esa categoría." };
  if (error) return { error: "No se pudo crear la categoría." };
  refresh();
  return {};
}

export async function deleteBizCategory(id: string) {
  const { supabase } = await business();
  await supabase.from("biz_expense_categories").delete().eq("id", id);
  refresh();
}

export async function createBizChannel(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const name = text(formData, "name");
  if (!name) return { error: "Escribe un nombre." };
  const { biz, supabase } = await business();
  const { error } = await supabase.from("biz_channels").insert({ business_id: biz.id, name: name.slice(0, 40) });
  if (error?.code === "23505") return { error: "Ese canal ya existe." };
  if (error) return { error: "No se pudo crear el canal." };
  refresh();
  return {};
}

export async function deleteBizChannel(id: string) {
  const { supabase } = await business();
  await supabase.from("biz_channels").delete().eq("id", id);
  refresh();
}

// Socios ------------------------------------------------------------------------

/** El negocio le regresa a un socio dinero que puso de su bolsa. */
export async function createReimbursement(_prev: BizFormState, formData: FormData): Promise<BizFormState> {
  const amount = parseAmount(formData.get("amount"));
  const memberId = text(formData, "member_id");
  const occurredOn = text(formData, "occurred_on");
  if (amount === null) return { error: "Escribe un monto mayor a 0." };
  if (!memberId || !isISODate(occurredOn)) return { error: "Datos incompletos." };

  const { biz, supabase } = await business();
  const { error } = await supabase
    .from("biz_reimbursements")
    .insert({ business_id: biz.id, member_id: memberId, amount, occurred_on: occurredOn });
  if (error) return { error: "No se pudo registrar." };
  refresh();
  return { message: "Reembolso registrado." };
}

export async function deleteReimbursement(id: string) {
  const { supabase } = await business();
  await supabase.from("biz_reimbursements").delete().eq("id", id);
  refresh();
}
