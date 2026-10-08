import { CURRENCY, LOCALE } from "./config";

const money = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY });

export function formatMoney(amount: number) {
  return money.format(amount);
}

/** "2026-10-07" → "7 oct" */
export function formatDay(isoDate: string) {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}

/** "2026-10" → "octubre 2026" */
export function formatMonth(month: string) {
  return new Intl.DateTimeFormat(LOCALE, { month: "long", year: "numeric", timeZone: "UTC" }).format(
    new Date(`${month}-01T00:00:00Z`),
  );
}
