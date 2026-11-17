"use server";

import { createHash, randomBytes } from "node:crypto";
import { refresh } from "next/cache";
import { requireUser } from "@/lib/supabase/server";

export type TokenState = { token?: string; error?: string };

/** Crea (o reemplaza) el token de captura. El anterior deja de funcionar. */
export async function rotateIngestToken(): Promise<TokenState> {
  const { supabase, userId } = await requireUser();
  const token = randomBytes(24).toString("base64url");
  const token_hash = createHash("sha256").update(token).digest("hex");
  const { error } = await supabase
    .from("ingest_tokens")
    .upsert({ user_id: userId, token_hash, created_at: new Date().toISOString(), last_used_at: null });
  if (error) return { error: "No se pudo generar el token." };
  refresh();
  return { token };
}

export async function dismissInboxItem(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("inbox_items").update({ status: "dismissed" }).eq("id", id).eq("status", "pending");
  refresh();
}

export async function dismissAllInbox() {
  const { supabase } = await requireUser();
  await supabase.from("inbox_items").update({ status: "dismissed" }).eq("status", "pending");
  refresh();
}
