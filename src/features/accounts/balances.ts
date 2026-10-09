// Cálculos de saldos. Funciones puras (sin Supabase ni Next) para poder
// probarlas aparte. Convención de signo "de activo": positivo = dinero que
// tienes, negativo = deuda (así se ve una tarjeta de crédito).

import type { Account, Transaction } from "@/lib/supabase/database.types";

export type AccountMovement = Pick<
  Transaction,
  "kind" | "amount" | "account_id" | "to_account_id" | "occurred_on" | "created_at"
>;

/** Cuánto cambia el saldo de `accountId` por un movimiento. */
export function effectOn(m: AccountMovement, accountId: string) {
  const amount = Number(m.amount);
  if (m.kind === "transfer") {
    if (m.account_id === accountId) return -amount;
    if (m.to_account_id === accountId) return amount;
    return 0;
  }
  if (m.account_id !== accountId) return 0;
  if (m.kind === "income") return amount;
  if (m.kind === "expense") return -amount;
  return amount; // adjustment: ya trae su signo
}

/**
 * Solo cuentan los movimientos registrados después de dar de alta (o
 * re-basar) la cuenta: lo anterior ya está incluido en el saldo inicial.
 */
export function countsFor(m: AccountMovement, account: Pick<Account, "opening_at">) {
  return Date.parse(m.created_at) > Date.parse(account.opening_at);
}

/** "2026-10-09" + n días. */
export function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export type AccountBalance = {
  /** Saldo según los movimientos registrados (sin rendimiento estimado). */
  book: number;
  /** Rendimiento estimado acumulado desde el último ajuste o alta. */
  interest: number;
  /** book + interest */
  balance: number;
  /** Fecha desde la que se estima el rendimiento. */
  interestSince: string;
};

/**
 * Saldo de una cuenta a la fecha `today`. Para cuentas con tasa anual, estima
 * el rendimiento con interés compuesto diario (tasa / 365) sobre el saldo de
 * cierre de cada día, desde la fecha del último ajuste (o del alta).
 */
export function computeBalance(
  account: Pick<Account, "id" | "opening_balance" | "opening_at" | "annual_rate">,
  movements: AccountMovement[],
  today: string,
  openingDate: string,
): AccountBalance {
  const counted = movements
    .filter((m) => countsFor(m, account) && effectOn(m, account.id) !== 0)
    .sort((a, b) => a.occurred_on.localeCompare(b.occurred_on));

  const book = counted.reduce((s, m) => s + effectOn(m, account.id), Number(account.opening_balance));

  const rate = Number(account.annual_rate ?? 0);
  const lastAdjustment = counted
    .filter((m) => m.kind === "adjustment" && m.account_id === account.id)
    .reduce((max, m) => (m.occurred_on > max ? m.occurred_on : max), "");
  const interestSince = lastAdjustment > openingDate ? lastAdjustment : openingDate;

  if (rate <= 0 || interestSince >= today) {
    return { book: round(book), interest: 0, balance: round(book), interestSince };
  }

  // Saldo al cierre del día anterior al inicio de la estimación.
  let running = Number(account.opening_balance);
  let i = 0;
  while (i < counted.length && counted[i].occurred_on < interestSince) {
    running += effectOn(counted[i], account.id);
    i++;
  }

  // Cada día: se aplican sus movimientos y se acredita el rendimiento del día.
  let interest = 0;
  for (let day = interestSince; day < today; day = addDays(day, 1)) {
    while (i < counted.length && counted[i].occurred_on <= day) {
      running += effectOn(counted[i], account.id);
      i++;
    }
    const daily = Math.max(0, running + interest) * (rate / 365);
    interest += daily;
  }

  return { book: round(book), interest: round(interest), balance: round(book + interest), interestSince };
}

/** Rendimiento estimado de un día con el saldo actual. */
export function dailyInterest(balance: number, annualRate: number) {
  return round(Math.max(0, balance) * (annualRate / 365));
}

/** Rendimiento estimado en 30 días si el saldo no cambia (interés compuesto diario). */
export function monthlyProjection(balance: number, annualRate: number) {
  return round(Math.max(0, balance) * ((1 + annualRate / 365) ** 30 - 1));
}

// Tarjetas de crédito ----------------------------------------------------------

function clampedDate(year: number, monthIndex: number, day: number) {
  const lastDay = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  return new Date(Date.UTC(year, monthIndex, Math.min(day, lastDay))).toISOString().slice(0, 10);
}

/** Fecha del último corte (<= hoy). Si el día no existe en el mes, usa el último día. */
export function lastStatementDate(today: string, statementDay: number) {
  const [y, m] = today.split("-").map(Number);
  const thisMonth = clampedDate(y, m - 1, statementDay);
  return thisMonth <= today ? thisMonth : clampedDate(y, m - 2, statementDay);
}

export function nextStatementDate(lastCut: string, statementDay: number) {
  const [y, m] = lastCut.split("-").map(Number);
  return clampedDate(y, m, statementDay);
}

/** Fecha límite de pago del estado de cuenta que cerró en `lastCut`. */
export function dueDateFor(lastCut: string, statementDay: number, dueDay: number) {
  const [y, m] = lastCut.split("-").map(Number);
  // Si el día de pago es posterior al de corte cae en el mismo mes; si no, en el siguiente.
  return dueDay > statementDay ? clampedDate(y, m - 1, dueDay) : clampedDate(y, m, dueDay);
}

export function daysBetween(from: string, to: string) {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

export type CardStatus = {
  debt: number;
  available: number | null;
  lastCut: string;
  nextCut: string;
  dueDate: string | null;
  daysToDue: number | null;
  /** Compras con fecha posterior al último corte (van al siguiente estado de cuenta). */
  periodSpending: number;
  /** Lo que falta pagar del último estado de cuenta para no generar intereses. */
  toPayNoInterest: number;
};

/**
 * Estado de una tarjeta. "Para no generar intereses" = deuda actual menos lo
 * comprado después del corte: es lo que queda del estado de cuenta, ya
 * descontando los pagos hechos desde entonces.
 */
export function cardStatus(
  account: Pick<Account, "id" | "credit_limit" | "statement_day" | "due_day">,
  balance: number,
  movements: AccountMovement[],
  today: string,
): CardStatus | null {
  if (!account.statement_day) return null;
  const debt = round(Math.max(0, -balance));
  const lastCut = lastStatementDate(today, account.statement_day);
  const periodSpending = round(
    movements
      .filter((m) => m.kind === "expense" && m.account_id === account.id && m.occurred_on > lastCut)
      .reduce((s, m) => s + Number(m.amount), 0),
  );
  const dueDate = account.due_day ? dueDateFor(lastCut, account.statement_day, account.due_day) : null;

  return {
    debt,
    available: account.credit_limit === null ? null : round(Number(account.credit_limit) - debt),
    lastCut,
    nextCut: nextStatementDate(lastCut, account.statement_day),
    dueDate,
    daysToDue: dueDate ? daysBetween(today, dueDate) : null,
    periodSpending,
    toPayNoInterest: round(Math.max(0, debt - periodSpending)),
  };
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
