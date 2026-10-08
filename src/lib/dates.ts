import { TIMEZONE } from "./config";

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de la app, no la del servidor. */
export function today() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TIMEZONE }).format(new Date());
}

/** Mes actual como "YYYY-MM". */
export function currentMonth() {
  return today().slice(0, 7);
}

/** Valida un "YYYY-MM" que viene de la URL; si no es válido usa el mes actual. */
export function parseMonth(value: string | string[] | undefined) {
  return typeof value === "string" && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) ? value : currentMonth();
}

/** Rango [start, end) de fechas ISO para filtrar un mes. */
export function monthRange(month: string) {
  return { start: `${month}-01`, end: `${shiftMonth(month, 1)}-01` };
}

export function shiftMonth(month: string, delta: number) {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}
