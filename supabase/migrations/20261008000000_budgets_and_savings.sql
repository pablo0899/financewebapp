-- Presupuesto fijo por categoría (aplica a todos los meses; lo gastado se
-- reinicia cada mes). Sustituye a la tabla budgets, que era por mes.
alter table public.categories
  add column monthly_budget numeric(12, 2) check (monthly_budget > 0);

drop table public.budgets;

-- Ahorro --------------------------------------------------------------------
create table public.savings_goals (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  icon        text not null default '🐷',
  color       text not null default '#22c55e',
  target      numeric(12, 2) check (target > 0),
  created_at  timestamptz not null default now()
);

-- amount > 0 es un depósito, amount < 0 un retiro.
create table public.savings_movements (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  goal_id      uuid not null references public.savings_goals (id) on delete cascade,
  amount       numeric(12, 2) not null check (amount <> 0),
  occurred_on  date not null default current_date,
  note         text check (char_length(note) <= 200),
  created_at   timestamptz not null default now()
);

create index savings_goals_user_idx on public.savings_goals (user_id);
create index savings_movements_goal_idx on public.savings_movements (goal_id);
create index savings_movements_user_date_idx on public.savings_movements (user_id, occurred_on desc);

alter table public.savings_goals     enable row level security;
alter table public.savings_movements enable row level security;

create policy "own savings goals" on public.savings_goals
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own savings movements" on public.savings_movements
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
