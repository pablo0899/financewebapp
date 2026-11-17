import "server-only";
import { cache } from "react";
import { shiftDays, toLocalDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import { parseInboxItem } from "./parse";

/** Entradas por confirmar, más recientes primero. */
export const getPendingInbox = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("inbox_items")
    .select("*")
    .eq("status", "pending")
    .order("received_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return data;
});

/** Cuántas entradas pendientes parecen movimientos (sin contar alertas ni duplicados). */
export const getPendingInboxCount = cache(async () => {
  const items = await getPendingInbox();
  return items.filter((item) => parseInboxItem(item).type !== "ignore").length;
});

/** Una entrada pendiente (para prellenar "Nuevo movimiento"); null si ya no está pendiente. */
export async function getPendingInboxItem(id: string) {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const { supabase } = await requireUser();
  const { data } = await supabase.from("inbox_items").select("*").eq("id", id).eq("status", "pending").maybeSingle();
  return data;
}

/** Si ya hay token de captura y cuándo llegó la última notificación. */
export const getIngestToken = cache(async () => {
  const { supabase } = await requireUser();
  const { data } = await supabase.from("ingest_tokens").select("created_at, last_used_at").maybeSingle();
  return data;
});

export type DuplicateCandidate = {
  id: string;
  amount: number;
  occurred_on: string;
  note: string | null;
  category: { name: string; icon: string } | null;
  account: { name: string; icon: string } | null;
};

/** Días de diferencia que se aceptan entre el aviso y un movimiento ya registrado. */
const DUPLICATE_WINDOW_DAYS = 2;

/**
 * Para cada entrada pendiente que parece movimiento, los movimientos ya
 * registrados a mano con el mismo monto en ±2 días (y que no estén ligados a
 * otra entrada de la bandeja). Así no se registra dos veces lo mismo.
 */
export const getDuplicateCandidates = cache(async () => {
  const items = await getPendingInbox();
  const movements = items.flatMap((item) => {
    const p = parseInboxItem(item);
    return p.type === "movement" ? [{ id: item.id, amount: p.amount, date: toLocalDate(item.received_at) }] : [];
  });
  const result = new Map<string, DuplicateCandidate[]>();
  if (movements.length === 0) return result;

  const dates = movements.map((m) => m.date).sort();
  const { supabase } = await requireUser();
  const [{ data: transactions, error }, { data: linked }] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, amount, occurred_on, note, category:categories(name, icon), account:accounts!transactions_account_id_fkey(name, icon)")
      .neq("kind", "adjustment")
      .gte("occurred_on", shiftDays(dates[0], -DUPLICATE_WINDOW_DAYS))
      .lte("occurred_on", shiftDays(dates[dates.length - 1], DUPLICATE_WINDOW_DAYS))
      .in("amount", [...new Set(movements.map((m) => m.amount))]),
    supabase.from("inbox_items").select("transaction_id").not("transaction_id", "is", null),
  ]);
  if (error) throw error;
  const taken = new Set((linked ?? []).map((l) => l.transaction_id));

  for (const m of movements) {
    const matches = (transactions ?? [])
      .filter((t) => !taken.has(t.id) && Number(t.amount) === m.amount && Math.abs(dayDiff(t.occurred_on, m.date)) <= DUPLICATE_WINDOW_DAYS)
      .sort((a, b) => Math.abs(dayDiff(a.occurred_on, m.date)) - Math.abs(dayDiff(b.occurred_on, m.date)))
      .map((t) => ({ ...t, amount: Number(t.amount) }));
    if (matches.length > 0) result.set(m.id, matches);
  }
  return result;
});

function dayDiff(a: string, b: string) {
  return (Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 86_400_000;
}
