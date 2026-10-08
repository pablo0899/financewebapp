"use client";

import { useActionState } from "react";
import { login, type LoginState } from "../actions";

const input = "w-full rounded-xl border border-border bg-surface px-4 py-3 outline-none focus:border-accent";
const button = "w-full rounded-xl bg-accent py-3 font-medium text-white disabled:opacity-60";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, { step: "email" });

  return (
    <form action={action} className="flex flex-col gap-3">
      {state.step === "email" ? (
        <>
          <input name="email" type="email" required autoComplete="email" placeholder="tu@correo.com" defaultValue={state.email} className={input} />
          <button disabled={pending} className={button}>
            {pending ? "Enviando…" : "Enviarme un código"}
          </button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">Te enviamos un código a {state.email}</p>
          <input type="hidden" name="email" value={state.email} />
          <input
            name="token"
            required
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="\d{6,8}"
            placeholder="123456"
            className={`${input} text-center text-2xl tracking-[0.5em]`}
          />
          <button disabled={pending} className={button}>
            {pending ? "Verificando…" : "Entrar"}
          </button>
        </>
      )}
      {state.error && <p className="text-sm text-expense">{state.error}</p>}
    </form>
  );
}
