import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import { monthRange, shiftDays, today } from "@/lib/dates";

const SELECT =
  "*, category:categories(id, name, icon, color), account:accounts!transactions_account_id_fkey(id, name, icon, kind), to_account:accounts!transactions_to_account_id_fkey(id, name, icon)";

/** Movimientos de un mes ("YYYY-MM"), más recientes primero, con su categoría. */
export const getMonthTransactions = cache(async (month: string) => {
  const { supabase } = await requireUser();
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT)
    .gte("occurred_on", start)
    .lt("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

/** Movimientos de los últimos `days` días (hoy incluido), más recientes primero. */
export const getRecentTransactions = cache(async (days: number) => {
  const { supabase } = await requireUser();
  const now = today();
  const { data, error } = await supabase
    .from("transactions")
    .select(SELECT)
    .gte("occurred_on", shiftDays(now, 1 - days))
    .lte("occurred_on", now)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export async function getTransaction(id: string) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("transactions").select(SELECT).eq("id", id).maybeSingle();
  if (error) throw error;
  return data;
}

export type TransactionWithCategory = Awaited<ReturnType<typeof getMonthTransactions>>[number];
