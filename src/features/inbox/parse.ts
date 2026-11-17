// Lee el texto de una entrada de la bandeja (correo o notificación) y saca lo
// necesario para registrarla. Es una función pura y se aplica al leer, así que
// mejorar una regla arregla también lo que ya estaba guardado.

import type { Account, InboxItem } from "@/lib/supabase/database.types";

export type ParsedKind = "expense" | "income" | "transfer_out";

export type Parsed =
  /** Un movimiento: monto y, si se pudo, contraparte. */
  | {
      type: "movement";
      kind: ParsedKind;
      amount: number;
      /** A quién se mandó / de quién llegó / dónde se pagó. */
      counterparty: string | null;
      /** Banco de la contraparte (transferencias). */
      bank: string | null;
      /** Texto corto de cuenta del origen, para elegir la cuenta (ej. "Mercado Pago", "Amex"). */
      accountHint: string | null;
    }
  /** No es un movimiento (alertas de seguridad, duplicados de Gmail…). */
  | { type: "ignore"; reason: string }
  /** No se reconoció: se muestra el texto tal cual. */
  | { type: "unknown" };

export function parseInboxItem(item: Pick<InboxItem, "source" | "app" | "title" | "body">): Parsed {
  const app = item.app ?? "";
  const text = cleanText(`${item.title ?? ""}\n${item.body ?? ""}`);

  // Gmail solo muestra remitente y asunto; el correo completo llega por el Apps Script.
  if (item.source === "notification" && /^gmail$/i.test(app)) {
    return { type: "ignore", reason: "Aviso de Gmail (el correo completo llega aparte)" };
  }

  const parsed = (/mercado ?pago/i.test(app) && parseMercadoPago(text)) || parseGeneric(app, text);
  if (parsed.type === "movement") return parsed;

  if (/llave de acceso|inicio de sesi[oó]n|nuevo dispositivo|c[oó]digo de (verificaci[oó]n|seguridad)|contrase[nñ]a|alerta de seguridad/i.test(text)) {
    return { type: "ignore", reason: "Alerta de seguridad" };
  }
  // Las notificaciones de Mercado Pago no traen el monto; el correo sí.
  if (item.source === "notification" && /mercado ?pago/i.test(app)) {
    return { type: "ignore", reason: "Aviso de Mercado Pago sin monto (el correo llega aparte)" };
  }
  return parsed;
}

// Mercado Pago ---------------------------------------------------------------

function parseMercadoPago(text: string): Parsed | null {
  const beneficiary = field(text, "Nombre y apellido");
  const bank = field(text, "Entidad");

  // "Ya enviamos tu transferencia de $ 320"
  const sent = text.match(/(?:enviamos tu transferencia|transferencia (?:fue )?enviada)[^$]*?\$\s*([\d.,]+)/i);
  if (sent) {
    const amount = parseMoney(sent[1]);
    if (amount) {
      return { type: "movement", kind: "transfer_out", amount, counterparty: beneficiary, bank, accountHint: "Mercado Pago" };
    }
  }

  // Dinero recibido (formato aún sin ejemplo real: se busca la frase típica).
  const received = text.match(/(?:recibiste|te (?:enviaron|transfirieron|depositaron)|ingres[oó] dinero)[^$]*?\$\s*([\d.,]+)/i);
  if (received) {
    const amount = parseMoney(received[1]);
    const from = field(text, "Nombre y apellido") ?? text.match(/\bde ([A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]+(?: [A-ZÁÉÍÓÚÑ][\wÁÉÍÓÚÑáéíóúñ]+){0,3})/)?.[1] ?? null;
    if (amount) return { type: "movement", kind: "income", amount, counterparty: from, bank, accountHint: "Mercado Pago" };
  }

  // Pagos y compras con la cuenta o la tarjeta de Mercado Pago.
  const paid = text.match(/(?:pagaste|tu pago|compra|cargo)[^$]*?\$\s*([\d.,]+)/i);
  if (paid) {
    const amount = parseMoney(paid[1]);
    if (amount) return { type: "movement", kind: "expense", amount, counterparty: merchant(text), bank: null, accountHint: "Mercado Pago" };
  }
  return null;
}

// Genérico (Google Wallet, Amex, Plata, BBVA…) ---------------------------------

function parseGeneric(app: string, text: string): Parsed {
  const money = text.match(/(?:\$|MXN|MX\$)\s*([\d.,]*\d)/i);
  const amount = money ? parseMoney(money[1]) : null;
  if (!amount) return { type: "unknown" };

  const kind: ParsedKind = /recibiste|dep[oó]sito|abono|te (?:enviaron|transfirieron)|n[oó]mina|reembolso|devoluci[oó]n/i.test(text)
    ? "income"
    : /transferencia|spei/i.test(text) && /enviaste|enviada|enviamos/i.test(text)
      ? "transfer_out"
      : "expense";

  return { type: "movement", kind, amount, counterparty: merchant(text), bank: null, accountHint: cardHint(text) ?? app };
}

// Helpers --------------------------------------------------------------------

/** Quita links, imágenes y espacios de más del texto plano de los correos. */
export function cleanText(raw: string) {
  return raw
    .replace(/<https?:\/\/[^>]*>/g, " ")
    .replace(/https?:\/\/\S+/g, " ")
    .replace(/\[image:[^\]]*\]/gi, " ")
    .replace(/[ ​-‍⁠﻿]/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n[\s]*/g, "\n")
    .trim();
}

/** "Etiqueta: *Valor*" → "Valor". */
function field(text: string, label: string) {
  const m = text.match(new RegExp(`${label}:\\s*\\*?([^*\\n]+?)\\*?\\s*(?:\\n|$)`, "i"));
  return m ? m[1].trim() : null;
}

/** "Pagaste $120 en OXXO" → "OXXO". */
function merchant(text: string) {
  const m = text.match(/\$\s*[\d.,]+\s+(?:MXN\s+)?(?:en|a)\s+([^\n.,]{2,40})/i);
  return m ? m[1].trim() : null;
}

/** Nombre de tarjeta mencionado en el texto (para pagos con Google Wallet). */
function cardHint(text: string) {
  return text.match(/\b(amex|american express|plata|bbva|mercado ?pago)\b/i)?.[1] ?? null;
}

/**
 * Montos como los escriben los bancos: "1", "320", "1,234.56", "1.234,56", "12,50".
 * Devuelve null si no es un número > 0.
 */
export function parseMoney(raw: string): number | null {
  let s = raw.trim().replace(/[.,]$/, "");
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot >= 0 && lastComma >= 0) {
    // El último separador es el decimal.
    s = lastDot > lastComma ? s.replace(/,/g, "") : s.replace(/\./g, "").replace(",", ".");
  } else if (lastComma >= 0) {
    // Solo comas: de miles si van grupos de 3 ("1,234"), decimal si no ("12,50").
    s = /^\d{1,3}(,\d{3})+$/.test(s) ? s.replace(/,/g, "") : s.replace(",", ".");
  } else if ((s.match(/\./g) ?? []).length > 1) {
    s = s.replace(/\./g, "");
  }
  const n = Number(s);
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null;
}

/** Cuenta de la app que corresponde a la pista (por nombre, sin acentos ni mayúsculas). */
export function matchAccount(accounts: Pick<Account, "id" | "name">[], hint: string | null) {
  if (!hint) return null;
  const h = normalize(hint);
  if (!h) return null;
  return accounts.find((a) => {
    const n = normalize(a.name);
    return n && (h.includes(n) || n.includes(h));
  }) ?? null;
}

function normalize(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/american express/g, "amex")
    .replace(/[^a-z0-9]/g, "");
}

/** Texto corto para la nota del movimiento. */
export function describe(p: Extract<Parsed, { type: "movement" }>) {
  if (!p.counterparty) return null;
  return (p.bank && p.kind === "transfer_out" ? `${p.counterparty} (${p.bank})` : p.counterparty).slice(0, 200);
}
