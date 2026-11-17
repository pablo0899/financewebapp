import "server-only";
import { cache } from "react";
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
