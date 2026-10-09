-- Cuentas: dónde está (o a quién se debe) el dinero.
--   debit:  cuenta bancaria / efectivo
--   credit: tarjeta de crédito (su saldo es deuda)
--   yield:  cuenta con rendimiento diario (ej. Mercado Pago)
create type public.account_kind as enum ('debit', 'credit', 'yield');

create table public.accounts (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name             text not null check (char_length(name) between 1 and 40),
  kind             public.account_kind not null,
  icon             text not null default '🏦',
  color            text not null default '#3b82f6',
  -- Saldo con signo de activo: positivo = dinero disponible, negativo = deuda.
  -- Solo cuentan los movimientos registrados después de opening_at.
  opening_balance  numeric(12, 2) not null default 0,
  opening_at       timestamptz not null default now(),
  credit_limit     numeric(12, 2) check (credit_limit > 0),
  statement_day    smallint check (statement_day between 1 and 31),
  due_day          smallint check (due_day between 1 and 31),
  annual_rate      numeric(6, 4) check (annual_rate >= 0 and annual_rate < 1),
  created_at       timestamptz not null default now(),
  unique (user_id, name)
);

alter table public.accounts enable row level security;

create policy "own accounts" on public.accounts
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create index accounts_user_idx on public.accounts (user_id);

-- Movimientos: cuenta de origen y, en transferencias, cuenta destino.
alter table public.transactions
  add column account_id    uuid references public.accounts (id) on delete set null,
  add column to_account_id uuid references public.accounts (id) on delete set null;

create index transactions_account_id_idx on public.transactions (account_id);
create index transactions_to_account_id_idx on public.transactions (to_account_id);

-- Los ajustes llevan signo (suben o bajan el saldo); todo lo demás es > 0.
alter table public.transactions drop constraint transactions_amount_check;
alter table public.transactions add constraint transactions_amount_check
  check ((kind = 'adjustment' and amount <> 0) or (kind <> 'adjustment' and amount > 0));

-- Las transferencias no tienen categoría y van entre dos cuentas distintas.
alter table public.transactions add constraint transactions_transfer_check
  check (kind <> 'transfer' or (category_id is null and to_account_id is not null and to_account_id <> account_id));

-- Las categorías siguen siendo solo de ingreso o gasto.
alter table public.categories add constraint categories_kind_check
  check (kind in ('income', 'expense'));
