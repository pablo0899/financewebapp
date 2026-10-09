"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { today, toLocalDate } from "@/lib/dates";
import { parseAmount, PRESET_COLORS } from "@/lib/forms";
import { requireUser } from "@/lib/supabase/server";
import type { AccountKind } from "@/lib/supabase/database.types";
import { computeBalance } from "./balances";

export type AccountFormState = { error?: string; message?: string };

const KINDS: AccountKind[] = ["debit", "credit", "yield"];

/** Campos editables comunes a alta y edición (todo menos el saldo). */
function readSettings(formData: FormData, kind: AccountKind) {
  const day = (name: string) => {
    const n = Number(formData.get(name));
    return Number.isInteger(n) && n >= 1 && n <= 31 ? n : null;
  };
  const ratePct = parseAmount(formData.get("annual_rate"));
  const color = String(formData.get("color") ?? "");
  return {
    name: String(formData.get("name") ?? "").trim(),
    icon: [...(String(formData.get("icon") ?? "").trim() || defaultIcon(kind))].slice(0, 2).join(""),
    color: PRESET_COLORS.includes(color) ? color : PRESET_COLORS[4],
    credit_limit: kind === "credit" ? parseAmount(formData.get("credit_limit")) : null,
    statement_day: kind === "credit" ? day("statement_day") : null,
    due_day: kind === "credit" ? day("due_day") : null,
    annual_rate: kind === "yield" && ratePct !== null && ratePct < 100 ? ratePct / 100 : null,
  };
}

function defaultIcon(kind: AccountKind) {
  return kind === "credit" ? "💳" : kind === "yield" ? "📈" : "🏦";
}

function parseSignedAmount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (raw === "") return null;
  if (raw === "0") return 0;
  return parseAmount(raw);
}

export async function createAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const kind = formData.get("kind") as AccountKind;
  if (!KINDS.includes(kind)) return { error: "Tipo de cuenta inválido." };
  const settings = readSettings(formData, kind);
  if (!settings.name) return { error: "Escribe un nombre." };

  // Para tarjetas se captura la deuda (positiva) y se guarda como saldo negativo.
  const amount = parseSignedAmount(formData.get("balance")) ?? 0;
  const { supabase } = await requireUser();
  const { error } = await supabase
    .from("accounts")
    .insert({ ...settings, kind, opening_balance: kind === "credit" ? -amount : amount });
  if (error?.code === "23505") return { error: "Ya tienes una cuenta con ese nombre." };
  if (error) return { error: "No se pudo crear la cuenta." };

  refresh();
  return {};
}

export async function updateAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const id = String(formData.get("id") ?? "");
  const { supabase } = await requireUser();
  const { data: account } = await supabase.from("accounts").select("kind").eq("id", id).single();
  if (!account) return { error: "Cuenta no encontrada." };

  const settings = readSettings(formData, account.kind);
  if (!settings.name) return { error: "Escribe un nombre." };
  const { error } = await supabase.from("accounts").update(settings).eq("id", id);
  if (error?.code === "23505") return { error: "Ya tienes una cuenta con ese nombre." };
  if (error) return { error: "No se pudo guardar." };

  refresh();
  return { message: "Guardado." };
}

/** Borra la cuenta; sus movimientos se conservan sin cuenta. */
export async function deleteAccount(id: string) {
  const { supabase } = await requireUser();
  await supabase.from("accounts").delete().eq("id", id);
  redirect("/cuentas");
}

/**
 * Ajusta el saldo al real: registra un movimiento "ajuste" por la diferencia
 * contra el saldo según movimientos. En cuentas con rendimiento esto también
 * "cobra" el rendimiento estimado y reinicia la estimación desde hoy.
 */
export async function reconcileAccount(_prev: AccountFormState, formData: FormData): Promise<AccountFormState> {
  const id = String(formData.get("id") ?? "");
  const real = parseSignedAmount(formData.get("real_balance"));
  if (real === null) return { error: "Escribe el saldo real." };

  const { supabase } = await requireUser();
  const [{ data: account }, { data: movements }] = await Promise.all([
    supabase.from("accounts").select("*").eq("id", id).single(),
    supabase
      .from("transactions")
      .select("kind, amount, account_id, to_account_id, occurred_on, created_at")
      .or(`account_id.eq.${id},to_account_id.eq.${id}`),
  ]);
  if (!account || !movements) return { error: "Cuenta no encontrada." };

  const now = today();
  const { book } = computeBalance(account, movements, now, toLocalDate(account.opening_at));
  const target = account.kind === "credit" ? -real : real;
  const diff = Math.round((target - book) * 100) / 100;
  if (diff === 0) return { message: "El saldo ya coincide." };

  const { error } = await supabase.from("transactions").insert({
    kind: "adjustment",
    amount: diff,
    account_id: id,
    occurred_on: now,
    note: account.kind === "yield" ? "Rendimientos y ajuste" : "Ajuste de saldo",
  });
  if (error) return { error: "No se pudo ajustar." };

  refresh();
  return { message: "Saldo actualizado." };
}
