-- Esquema inicial: categorías, movimientos y presupuestos.
-- Cada fila pertenece a un usuario y RLS garantiza que solo él la vea.

create type public.movement_kind as enum ('income', 'expense');

-- Categorías ---------------------------------------------------------------
create table public.categories (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 40),
  kind        public.movement_kind not null,
  icon        text not null default '💸',
  color       text not null default '#64748b',
  created_at  timestamptz not null default now(),
  unique (user_id, kind, name)
);

-- Movimientos --------------------------------------------------------------
create table public.transactions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid references public.categories (id) on delete set null,
  kind         public.movement_kind not null,
  amount       numeric(12, 2) not null check (amount > 0),
  occurred_on  date not null default current_date,
  note         text check (char_length(note) <= 200),
  created_at   timestamptz not null default now()
);

create index transactions_user_date_idx on public.transactions (user_id, occurred_on desc);

-- Presupuestos (límite mensual por categoría de gasto) ---------------------
create table public.budgets (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null default auth.uid() references auth.users (id) on delete cascade,
  category_id  uuid not null references public.categories (id) on delete cascade,
  month        date not null check (extract(day from month) = 1),
  amount       numeric(12, 2) not null check (amount > 0),
  created_at   timestamptz not null default now(),
  unique (user_id, category_id, month)
);

-- Row Level Security -------------------------------------------------------
alter table public.categories   enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets      enable row level security;

create policy "own categories" on public.categories
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own transactions" on public.transactions
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

create policy "own budgets" on public.budgets
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Categorías por defecto al registrarse -----------------------------------
create function public.seed_default_categories()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.categories (user_id, name, kind, icon, color) values
    (new.id, 'Comida',          'expense', '🍔', '#f97316'),
    (new.id, 'Súper',           'expense', '🛒', '#eab308'),
    (new.id, 'Transporte',      'expense', '🚗', '#3b82f6'),
    (new.id, 'Casa',            'expense', '🏠', '#8b5cf6'),
    (new.id, 'Servicios',       'expense', '💡', '#06b6d4'),
    (new.id, 'Salud',           'expense', '💊', '#ef4444'),
    (new.id, 'Entretenimiento', 'expense', '🎬', '#ec4899'),
    (new.id, 'Otros gastos',    'expense', '💸', '#64748b'),
    (new.id, 'Sueldo',          'income',  '💼', '#22c55e'),
    (new.id, 'Otros ingresos',  'income',  '💰', '#10b981');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.seed_default_categories();
