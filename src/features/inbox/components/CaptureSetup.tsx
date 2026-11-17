"use client";

import { useActionState, useState } from "react";
import { rotateIngestToken, type TokenState } from "../actions";

type Props = {
  endpoint: string;
  /** null si todavía no hay token. */
  status: { created_at: string; last_used_at: string | null } | null;
  lastUsedLabel: string | null;
};

/** Generar el token de captura e instrucciones para MacroDroid. */
export function CaptureSetup({ endpoint, status, lastUsedLabel }: Props) {
  const [state, action, pending] = useActionState<TokenState>(rotateIngestToken, {});
  const token = state.token;

  return (
    <details className="rounded-xl bg-surface p-4" open={!status || Boolean(token)}>
      <summary className="cursor-pointer font-medium">📲 Captura automática</summary>
      <div className="mt-3 flex flex-col gap-3 text-sm">
        <p className="text-muted">
          {!status
            ? "Aún no está conectada. Genera un token y configúralo en MacroDroid."
            : lastUsedLabel
              ? `Conectada. Última notificación recibida: ${lastUsedLabel}.`
              : "Token generado, pero todavía no llega ninguna notificación."}
        </p>

        {token ? (
          <div className="flex flex-col gap-2 rounded-lg border border-accent p-3">
            <p className="font-medium">Copia el token ahora: no se vuelve a mostrar.</p>
            <CopyField label="Token" value={token} />
          </div>
        ) : (
          <form
            action={action}
            onSubmit={(e) => {
              if (status && !confirm("El token actual dejará de funcionar y tendrás que cambiarlo en MacroDroid. ¿Continuar?"))
                e.preventDefault();
            }}
          >
            <button disabled={pending} className="w-full rounded-lg bg-accent py-2 font-medium text-white disabled:opacity-60">
              {pending ? "Generando…" : status ? "Generar un token nuevo" : "Generar token"}
            </button>
          </form>
        )}
        {state.error && <p className="text-expense">{state.error}</p>}

        <CopyField label="URL" value={endpoint} />

        <ol className="flex list-decimal flex-col gap-2 pl-5 text-muted">
          <li>
            En MacroDroid crea una macro. <b className="text-foreground">Disparador:</b> Notificación → Notificación recibida.
            Elige las apps: Google Wallet, Amex, Mercado Pago, Plata y BBVA.
          </li>
          <li>
            <b className="text-foreground">Acción:</b> Conectividad → Petición HTTP. Método <code>POST</code> y la URL de arriba.
          </li>
          <li>
            En <b className="text-foreground">Encabezados</b> agrega <code>Authorization</code> con el valor{" "}
            <code>Bearer &lt;tu token&gt;</code> (la palabra Bearer, un espacio y el token).
          </li>
          <li>
            En <b className="text-foreground">Parámetros de consulta</b> agrega <code>app</code>, <code>title</code> y{" "}
            <code>text</code>. Para cada uno usa el botón de texto mágico y elige el nombre de la app, el título y el texto
            de la notificación.
          </li>
          <li>
            En Ajustes de Android, quita la optimización de batería a MacroDroid para que no se pierdan notificaciones.
          </li>
          <li>Haz un pago de prueba (o espera uno) y recarga esta pantalla: debe aparecer arriba.</li>
        </ol>
      </div>
    </details>
  );
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center gap-2">
      <span className="w-12 shrink-0 text-xs text-muted">{label}</span>
      <code className="min-w-0 flex-1 truncate rounded bg-background px-2 py-1">{value}</code>
      <button
        type="button"
        className="shrink-0 text-accent"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          } catch {}
        }}
      >
        {copied ? "Copiado" : "Copiar"}
      </button>
    </div>
  );
}
