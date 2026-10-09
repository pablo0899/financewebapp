import "server-only";
import { cache } from "react";
import { today, toLocalDate } from "@/lib/dates";
import { requireUser } from "@/lib/supabase/server";
import type { Account, AccountKind } from "@/lib/supabase/database.types";
import { cardStatus, computeBalance, dailyInterest, monthlyProjection } from "./balances";

const KIND_ORDER: Record<AccountKind, number> = { yield: 0, debit: 1, credit: 2 };

export const getAccounts = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.from("accounts").select("*").order("created_at");
  if (error) throw error;
  return data.sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]);
});

/** Todos los movimientos ligados a alguna cuenta (escala personal: cabe en memoria). */
const getAccountMovements = cache(async () => {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select("kind, amount, account_id, to_account_id, occurred_on, created_at")
    .or("account_id.not.is.null,to_account_id.not.is.null");
  if (error) throw error;
  return data;
});

function summarize(account: Account, movements: Awaited<ReturnType<typeof getAccountMovements>>, now: string) {
  const balance = computeBalance(account, movements, now, toLocalDate(account.opening_at));
  const rate = Number(account.annual_rate ?? 0);
  return {
    account,
    ...balance,
    rate,
    daily: account.kind === "yield" ? dailyInterest(balance.balance, rate) : 0,
    projection30: account.kind === "yield" ? monthlyProjection(balance.balance, rate) : 0,
    card: account.kind === "credit" ? cardStatus(account, balance.balance, movements, now) : null,
  };
}

export type AccountSummary = ReturnType<typeof summarize>;

/** Saldos de todas las cuentas y totales: liquidez, deuda y saldo real. */
export const getAccountsOverview = cache(async () => {
  const [accounts, movements] = await Promise.all([getAccounts(), getAccountMovements()]);
  const now = today();
  const items = accounts.map((a) => summarize(a, movements, now));

  const liquidity = items.filter((i) => i.account.kind !== "credit").reduce((s, i) => s + i.balance, 0);
  const debt = items.filter((i) => i.account.kind === "credit").reduce((s, i) => s + Math.max(0, -i.balance), 0);

  return { items, liquidity, debt, net: liquidity - debt };
});

export async function getAccountSummary(id: string) {
  const { items } = await getAccountsOverview();
  return items.find((i) => i.account.id === id) ?? null;
}

/** Movimientos donde participa la cuenta (como origen o destino), más recientes primero. */
export async function getAccountTransactions(id: string, limit = 30) {
  const { supabase } = await requireUser();
  const { data, error } = await supabase
    .from("transactions")
    .select(
      "*, category:categories(id, name, icon, color), account:accounts!transactions_account_id_fkey(id, name, icon), to_account:accounts!transactions_to_account_id_fkey(id, name, icon)",
    )
    .or(`account_id.eq.${id},to_account_id.eq.${id}`)
    .order("occurred_on", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
}

/** Cuenta del último gasto o ingreso registrado, para preseleccionarla. */
export async function getLastUsedAccountId() {
  const { supabase } = await requireUser();
  const { data } = await supabase
    .from("transactions")
    .select("account_id")
    .in("kind", ["income", "expense"])
    .not("account_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data?.account_id ?? null;
}
