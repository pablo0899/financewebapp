import "server-only";
import { cache } from "react";
import { monthRange, shiftMonth } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";

/** Negocio del usuario (por ahora uno: Prismatix) y su socio correspondiente. */
export const getBusiness = cache(async () => {
  const { supabase, userId } = await requireUser();
  const { data, error } = await supabase
    .from("business_members")
    .select("id, business:businesses(id, name)")
    .eq("user_id", userId)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  if (!data?.business) return null;
  return { id: data.business.id, name: data.business.name, memberId: data.id };
});

/** Socios, categorías de gasto, canales y artículos del negocio. */
export const getBizLookups = cache(async (businessId: string) => {
  const { supabase } = await requireUser();
  const [members, categories, channels, items] = await Promise.all([
    supabase.from("business_members").select("*").eq("business_id", businessId).order("created_at"),
    supabase.from("biz_expense_categories").select("*").eq("business_id", businessId).order("name"),
    supabase.from("biz_channels").select("*").eq("business_id", businessId).order("name"),
    supabase.from("biz_items").select("*").eq("business_id", businessId).order("name"),
  ]);
  for (const r of [members, categories, channels, items]) if (r.error) throw r.error;
  return { members: members.data!, categories: categories.data!, channels: channels.data!, items: items.data! };
});

const EXPENSE_SELECT =
  "*, member:business_members!biz_expenses_spent_by_business_id_fkey(id, display_name, color), category:biz_expense_categories(id, name, icon, color)";
const SALE_SELECT = "*, item:biz_items(id, name, icon), channel:biz_channels(id, name)";

/** Gastos y ventas entre dos fechas [start, end). */
const getRange = cache(async (businessId: string, start: string, end: string) => {
  const { supabase } = await requireUser();
  const [expenses, sales] = await Promise.all([
    supabase
      .from("biz_expenses")
      .select(EXPENSE_SELECT)
      .eq("business_id", businessId)
      .gte("occurred_on", start)
      .lt("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase
      .from("biz_sales")
      .select(SALE_SELECT)
      .eq("business_id", businessId)
      .gte("occurred_on", start)
      .lt("occurred_on", end)
      .order("occurred_on", { ascending: false })
      .order("created_at", { ascending: false }),
  ]);
  if (expenses.error) throw expenses.error;
  if (sales.error) throw sales.error;
  return { expenses: expenses.data, sales: sales.data };
});

export async function getBizMonth(businessId: string, month: string) {
  const { start, end } = monthRange(month);
  return getRange(businessId, start, end);
}

export type BizExpenseRow = Awaited<ReturnType<typeof getBizMonth>>["expenses"][number];
export type BizSaleRow = Awaited<ReturnType<typeof getBizMonth>>["sales"][number];

const net = (s: { amount: number; fees: number }) => Number(s.amount) - Number(s.fees);

type Group = { key: string; label: string; icon?: string; color?: string; value: number; count: number };
function groupBy<T>(rows: T[], key: (r: T) => Omit<Group, "value" | "count">, value: (r: T) => number, count: (r: T) => number = () => 1) {
  const map = new Map<string, Group>();
  for (const r of rows) {
    const k = key(r);
    const g = map.get(k.key) ?? { ...k, value: 0, count: 0 };
    g.value += value(r);
    g.count += count(r);
    map.set(k.key, g);
  }
  return [...map.values()].sort((a, b) => b.value - a.value);
}

/** Todo lo que muestra el Resumen de un mes, más la tendencia de 6 meses. */
export async function getBizSummary(businessId: string, month: string) {
  const firstMonth = shiftMonth(month, -5);
  const { end } = monthRange(month);
  const [range, { members }] = await Promise.all([getRange(businessId, `${firstMonth}-01`, end), getBizLookups(businessId)]);

  const inMonth = (d: string) => d.startsWith(month);
  const expenses = range.expenses.filter((e) => inMonth(e.occurred_on));
  const sales = range.sales.filter((s) => inMonth(s.occurred_on));

  const income = sales.reduce((s, r) => s + net(r), 0);
  const gross = sales.reduce((s, r) => s + Number(r.amount), 0);
  const spent = expenses.reduce((s, r) => s + Number(r.amount), 0);

  const trend = Array.from({ length: 6 }, (_, i) => {
    const m = shiftMonth(firstMonth, i);
    return {
      month: m,
      income: range.sales.filter((s) => s.occurred_on.startsWith(m)).reduce((s, r) => s + net(r), 0),
      expense: range.expenses.filter((e) => e.occurred_on.startsWith(m)).reduce((s, r) => s + Number(r.amount), 0),
    };
  });

  // Todos los socios aparecen en el anillo, aunque no hayan gastado este mes.
  const byMember = members.map((m) => ({
    key: m.id,
    label: m.display_name,
    color: m.color,
    value: expenses.filter((e) => e.spent_by === m.id).reduce((s, e) => s + Number(e.amount), 0),
  }));

  return {
    income,
    gross,
    fees: gross - income,
    spent,
    profit: income - spent,
    margin: income > 0 ? (income - spent) / income : null,
    pieces: sales.reduce((s, r) => s + r.quantity, 0),
    salesCount: sales.length,
    byMember,
    byCategory: groupBy(
      expenses,
      (e) => ({ key: e.category?.id ?? "none", label: e.category?.name ?? "Sin categoría", icon: e.category?.icon ?? "❔", color: e.category?.color ?? "#94a3b8" }),
      (e) => Number(e.amount),
    ),
    byItem: groupBy(
      sales,
      (s) => ({ key: s.item?.id ?? "none", label: s.item?.name ?? "Sin artículo", icon: s.item?.icon ?? "❔" }),
      net,
      (s) => s.quantity,
    ),
    byChannel: groupBy(sales, (s) => ({ key: s.channel?.id ?? "none", label: s.channel?.name ?? "Sin canal" }), net),
    trend,
  };
}

/**
 * Cuentas entre el negocio y sus socios (histórico):
 * - Lo que el negocio le debe a cada socio = gastos que pagó de su bolsa − reembolsos.
 * - Caja = ventas netas − gastos pagados con dinero del negocio − reembolsos.
 */
export async function getBizBalances(businessId: string) {
  const { supabase } = await requireUser();
  const [sales, expenses, reimbursements, { members }] = await Promise.all([
    supabase.from("biz_sales").select("amount, fees").eq("business_id", businessId),
    supabase.from("biz_expenses").select("amount, paid_with, spent_by").eq("business_id", businessId),
    supabase
      .from("biz_reimbursements")
      .select("id, amount, member_id, occurred_on")
      .eq("business_id", businessId)
      .order("occurred_on", { ascending: false }),
    getBizLookups(businessId),
  ]);
  for (const r of [sales, expenses, reimbursements]) if (r.error) throw r.error;

  const reimbursedTo = (id: string) => reimbursements.data!.filter((r) => r.member_id === id).reduce((s, r) => s + Number(r.amount), 0);
  const owed = members.map((m) => {
    const fronted = expenses.data!.filter((e) => e.paid_with === "personal" && e.spent_by === m.id).reduce((s, e) => s + Number(e.amount), 0);
    const reimbursed = reimbursedTo(m.id);
    return { member: m, fronted, reimbursed, owed: Math.round((fronted - reimbursed) * 100) / 100 };
  });

  const cash =
    sales.data!.reduce((s, r) => s + net(r), 0) -
    expenses.data!.filter((e) => e.paid_with === "business").reduce((s, e) => s + Number(e.amount), 0) -
    reimbursements.data!.reduce((s, r) => s + Number(r.amount), 0);

  return { owed, cash: Math.round(cash * 100) / 100, reimbursements: reimbursements.data!, members };
}
