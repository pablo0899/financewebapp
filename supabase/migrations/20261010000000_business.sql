-- Finanzas de negocio (Prismatix), separadas de las personales. Los datos
-- pertenecen al negocio y los ven todos sus miembros (Pablo y Ximena).

create table public.businesses (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 60),
  created_at  timestamptz not null default now()
);

-- Socios. user_id es null mientras la persona no tenga login: aun así se le
-- pueden asignar gastos.
create table public.business_members (
  id            uuid primary key default gen_random_uuid(),
  business_id   uuid not null references public.businesses (id) on delete cascade,
  user_id       uuid references auth.users (id) on delete set null,
  display_name  text not null check (char_length(display_name) between 1 and 40),
  color         text not null default '#3b82f6',
  role          text not null default 'member' check (role in ('owner', 'member')),
  created_at    timestamptz not null default now(),
  unique (business_id, user_id),
  unique (business_id, display_name),
  unique (id, business_id)
);

-- La verificación de membresía vive en un esquema no expuesto por la API y es
-- security definer para que las políticas no se llamen a sí mismas en bucle.
create schema if not exists private;
grant usage on schema private to authenticated;

create function private.is_business_member(bid uuid)
returns boolean
language sql
security definer
stable
set search_path = ''
as $$
  select exists (
    select 1 from public.business_members
    where business_id = bid and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_business_member(uuid) from public, anon;
grant execute on function private.is_business_member(uuid) to authenticated;

create table public.biz_expense_categories (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  icon         text not null default '📦',
  color        text not null default '#64748b',
  created_at   timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);

create table public.biz_channels (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 40),
  created_at   timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);

-- Catálogo de artículos que se venden.
create table public.biz_items (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  name         text not null check (char_length(name) between 1 and 60),
  icon         text not null default '🔷',
  price        numeric(12, 2) check (price > 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now(),
  unique (business_id, name),
  unique (id, business_id)
);

create table public.biz_expenses (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  spent_by     uuid not null,
  category_id  uuid,
  description  text not null check (char_length(description) between 1 and 120),
  amount       numeric(12, 2) not null check (amount > 0),
  occurred_on  date not null default current_date,
  -- 'business': salió de la caja del negocio; 'personal': lo puso de su bolsa
  -- quien hizo el gasto y el negocio se lo debe.
  paid_with    text not null default 'business' check (paid_with in ('business', 'personal')),
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  -- Llaves compuestas: solo se puede referenciar algo del mismo negocio.
  foreign key (spent_by, business_id) references public.business_members (id, business_id),
  foreign key (category_id, business_id) references public.biz_expense_categories (id, business_id) on delete set null (category_id)
);

create table public.biz_sales (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  item_id      uuid,
  channel_id   uuid,
  quantity     integer not null default 1 check (quantity > 0),
  amount       numeric(12, 2) not null check (amount > 0),        -- total cobrado
  fees         numeric(12, 2) not null default 0 check (fees >= 0), -- comisión + envío
  customer     text check (char_length(customer) <= 80),
  note         text check (char_length(note) <= 200),
  occurred_on  date not null default current_date,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  check (fees <= amount),
  foreign key (item_id, business_id) references public.biz_items (id, business_id) on delete set null (item_id),
  foreign key (channel_id, business_id) references public.biz_channels (id, business_id) on delete set null (channel_id)
);

-- Cuando el negocio le regresa a un socio lo que puso de su bolsa.
create table public.biz_reimbursements (
  id           uuid primary key default gen_random_uuid(),
  business_id  uuid not null references public.businesses (id) on delete cascade,
  member_id    uuid not null,
  amount       numeric(12, 2) not null check (amount > 0),
  occurred_on  date not null default current_date,
  created_by   uuid default auth.uid() references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  foreign key (member_id, business_id) references public.business_members (id, business_id)
);

-- Índices -------------------------------------------------------------------
create index business_members_user_idx on public.business_members (user_id);
create index biz_expense_categories_business_idx on public.biz_expense_categories (business_id);
create index biz_channels_business_idx on public.biz_channels (business_id);
create index biz_items_business_idx on public.biz_items (business_id);
create index biz_expenses_business_date_idx on public.biz_expenses (business_id, occurred_on desc);
create index biz_expenses_spent_by_idx on public.biz_expenses (spent_by);
create index biz_expenses_category_idx on public.biz_expenses (category_id);
create index biz_expenses_created_by_idx on public.biz_expenses (created_by);
create index biz_sales_business_date_idx on public.biz_sales (business_id, occurred_on desc);
create index biz_sales_item_idx on public.biz_sales (item_id);
create index biz_sales_channel_idx on public.biz_sales (channel_id);
create index biz_sales_created_by_idx on public.biz_sales (created_by);
create index biz_reimbursements_business_idx on public.biz_reimbursements (business_id);
create index biz_reimbursements_member_idx on public.biz_reimbursements (member_id);
create index biz_reimbursements_created_by_idx on public.biz_reimbursements (created_by);

-- RLS -----------------------------------------------------------------------
alter table public.businesses             enable row level security;
alter table public.business_members       enable row level security;
alter table public.biz_expense_categories enable row level security;
alter table public.biz_channels           enable row level security;
alter table public.biz_items              enable row level security;
alter table public.biz_expenses           enable row level security;
alter table public.biz_sales              enable row level security;
alter table public.biz_reimbursements     enable row level security;

-- Negocio y socios: solo lectura desde la app (se administran por SQL).
create policy "members read business" on public.businesses
  for select using ((select private.is_business_member(id)));
create policy "members read members" on public.business_members
  for select using ((select private.is_business_member(business_id)));

create policy "members manage categories" on public.biz_expense_categories
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
create policy "members manage channels" on public.biz_channels
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
create policy "members manage items" on public.biz_items
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
create policy "members manage expenses" on public.biz_expenses
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
create policy "members manage sales" on public.biz_sales
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
create policy "members manage reimbursements" on public.biz_reimbursements
  for all using ((select private.is_business_member(business_id))) with check ((select private.is_business_member(business_id)));
