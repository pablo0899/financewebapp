import "server-only";
import { cache } from "react";
import { requireUser } from "@/lib/supabase/server";
import { monthRange } from "@/lib/dates";

/** Movimientos de un mes ("YYYY-MM"), más recientes primero, con su categoría. */
export const getMonthTransactions = cache(async (month: string) => {
  const { supabase } = await requireUser();
  const { start, end } = monthRange(month);
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "*, category:categories(id, name, icon, color), account:accounts!transactions_account_id_fkey(id, name, icon), to_account:accounts!transactions_to_account_id_fkey(id, name, icon)",
    )
    .gte("occurred_on", start)
    .lt("occurred_on", end)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data;
});

export type TransactionWithCategory = Awaited<ReturnType<typeof getMonthTransactions>>[number];
