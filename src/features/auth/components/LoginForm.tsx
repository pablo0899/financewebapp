"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const input = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});

  return (
    <form action={action} className="flex flex-col gap-3">
      <input name="email" type="email" required autoComplete="username" placeholder="tu@correo.com" defaultValue={state.email} className={input} />
      <input name="password" type="password" required autoComplete="current-password" placeholder="Contraseña" className={input} />
      <button disabled={pending} className="w-full rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60">
        {pending ? "Entrando…" : "Entrar"}
      </button>
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
    </form>
  );
}
