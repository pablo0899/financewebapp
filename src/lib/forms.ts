/** Lee un monto de un formulario ("1,234.5" o "1234,5"). Devuelve null si no es > 0. */
export function parseAmount(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim().replace(/\s/g, "");
  // Acepta coma decimal si no hay punto ("12,50"); si hay ambos, la coma es de miles.
  const normalized = raw.includes(".") ? raw.replace(/,/g, "") : raw.replace(",", ".");
  const amount = Number(normalized);
  if (!normalized || !Number.isFinite(amount) || amount <= 0) return null;
  return Math.round(amount * 100) / 100;
}

export function isISODate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

/** Paleta para categorías y metas nuevas. */
export const PRESET_COLORS = [
  "#f97316",
  "#eab308",
  "#22c55e",
  "#06b6d4",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#ef4444",
  "#64748b",
];
