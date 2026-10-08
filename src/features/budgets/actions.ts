"use server";

import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

/** Crea, actualiza o (si el monto queda vacío) elimina el presupuesto de una categoría. */
export async function saveBudget(formData: FormData) {
  const categoryId = String(formData.get("category_id") ?? "");
  const month = String(formData.get("month") ?? "");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  if (!categoryId || !/^\d{4}-\d{2}$/.test(month)) return;

  const { supabase } = await requireUser();
  const monthStart = `${month}-01`;

  if (!Number.isFinite(amount) || amount <= 0) {
    await supabase.from("budgets").delete().eq("category_id", categoryId).eq("month", monthStart);
  } else {
    await supabase
      .from("budgets")
      .upsert(
        { category_id: categoryId, month: monthStart, amount: Math.round(amount * 100) / 100 },
        { onConflict: "user_id,category_id,month" },
      );
  }
  refresh();
}
