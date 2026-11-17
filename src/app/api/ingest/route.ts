import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import type { Database } from "@/lib/supabase/database.types";

// Recibe notificaciones (MacroDroid) y, más adelante, correos y SMS.
// No usa la sesión del navegador: se autentica con el token de captura del
// usuario en `Authorization: Bearer <token>`. El proxy no pasa por aquí.
//
// Los campos pueden venir como JSON, como formulario o en la query string
// (lo más cómodo en MacroDroid, que codifica los valores solo):
//   app, title, text (o body), received_at (ISO u epoch ms), source, id

const SOURCES = ["notification", "email", "sms"] as const;
type Source = (typeof SOURCES)[number];

const LIMITS = { app: 100, title: 500, body: 4000, id: 200 };

export async function POST(request: NextRequest) {
  const token = request.headers.get("authorization")?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
  if (!token) return Response.json({ error: "Falta el token." }, { status: 401 });

  const fields = await readFields(request);
  if (!fields) return Response.json({ error: "Cuerpo inválido." }, { status: 400 });
  const pick = (...names: string[]) => names.map((n) => fields.get(n)?.trim()).find(Boolean);

  const title = clip(pick("title"), LIMITS.title);
  const body = clip(pick("text", "body", "message"), LIMITS.body);
  if (!title && !body) return Response.json({ error: "Falta el texto." }, { status: 400 });

  const source = (pick("source") ?? "notification") as Source;
  if (!SOURCES.includes(source)) return Response.json({ error: "Origen inválido." }, { status: 400 });

  const supabase = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
  const { data, error } = await supabase.rpc("ingest_inbox_item", {
    p_token: token,
    p_source: source,
    p_app: clip(pick("app"), LIMITS.app),
    p_title: title,
    p_body: body,
    p_received_at: parseTimestamp(pick("received_at")),
    p_external_id: clip(pick("id"), LIMITS.id),
  });

  if (error) {
    console.error("ingest_inbox_item", error);
    return Response.json({ error: "No se pudo guardar." }, { status: 500 });
  }
  if (data === "unauthorized") return Response.json({ error: "Token inválido." }, { status: 401 });
  return Response.json({ status: data }, { status: data === "created" ? 201 : 200 });
}

/** Junta los campos de la query string y del cuerpo (JSON o formulario). */
async function readFields(request: NextRequest): Promise<Map<string, string> | null> {
  const fields = new Map<string, string>();
  request.nextUrl.searchParams.forEach((value, key) => fields.set(key, value));

  const type = request.headers.get("content-type") ?? "";
  const raw = await request.text();
  if (!raw.trim()) return fields;

  if (type.includes("application/json")) {
    try {
      const json: unknown = JSON.parse(raw);
      if (!json || typeof json !== "object" || Array.isArray(json)) return null;
      for (const [key, value] of Object.entries(json)) {
        if (typeof value === "string" || typeof value === "number") fields.set(key, String(value));
      }
    } catch {
      return null;
    }
  } else if (type.includes("application/x-www-form-urlencoded")) {
    new URLSearchParams(raw).forEach((value, key) => fields.set(key, value));
  } else if (!fields.has("text")) {
    // Texto plano: todo el cuerpo es la notificación.
    fields.set("text", raw);
  }
  return fields;
}

function clip(value: string | undefined, max: number) {
  return value ? value.slice(0, max) : undefined;
}

/** ISO 8601 o epoch en milisegundos (MacroDroid da ambos). Sin fecha válida → ahora. */
function parseTimestamp(value: string | undefined) {
  if (!value) return undefined;
  const date = /^\d{12,14}$/.test(value) ? new Date(Number(value)) : new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  // Fechas absurdas (reloj mal puesto) se ignoran.
  if (Math.abs(date.getTime() - Date.now()) > 7 * 24 * 3600 * 1000) return undefined;
  return date.toISOString();
}
