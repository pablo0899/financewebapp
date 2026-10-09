"use client";

import type { Account } from "@/lib/supabase/database.types";
import { setTransactionAccount } from "../actions";

/** Selector para cambiar la cuenta de un movimiento; guarda al elegir. (16px para que iOS no haga zoom.) */
export function AccountSelect({
  transactionId,
  accountId,
  accounts,
}: {
  transactionId: string;
  accountId: string | null;
  accounts: Pick<Account, "id" | "name" | "icon">[];
}) {
  return (
    <form action={setTransactionAccount}>
      <input type="hidden" name="id" value={transactionId} />
      <select
        name="account_id"
        defaultValue={accountId ?? ""}
        onChange={(e) => e.currentTarget.form?.requestSubmit()}
        aria-label="Cuenta"
        className={`max-w-full rounded-md border bg-background px-1.5 py-0.5 ${accountId ? "border-border text-muted" : "border-amber-500 text-amber-600 dark:text-amber-400"}`}
      >
        <option value="">⚠ Sin cuenta</option>
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.icon} {a.name}
          </option>
        ))}
      </select>
    </form>
  );
}
