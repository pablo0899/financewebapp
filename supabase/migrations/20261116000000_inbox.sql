-- Bandeja de movimientos por confirmar.
-- Las notificaciones del teléfono (MacroDroid) y, después, los correos llegan a
-- /api/ingest sin sesión: se autentican con un token por usuario y se guardan
-- aquí tal cual. El usuario los convierte en movimientos o los descarta.

-- Token de captura -----------------------------------------------------------
-- Solo se guarda el hash (sha256 en hex); el token en claro se muestra una vez.
create table public.ingest_tokens (
  user_id       uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  token_hash    text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at    timestamptz not null default now(),
  last_used_at  timestamptz
);

alter table public.ingest_tokens enable row level security;

create policy "own ingest token" on public.ingest_tokens
  for all using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));

-- Entradas de la bandeja ----------------------------------------------------
create type public.inbox_status as enum ('pending', 'confirmed', 'dismissed');

create table public.inbox_items (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users (id) on delete cascade,
  source          text not null check (source in ('notification', 'email', 'sms')),
  -- App o remitente que lo mandó (ej. "Google Wallet", "Mercado Pago").
  app             text check (char_length(app) <= 100),
  title           text check (char_length(title) <= 500),
  body            text check (char_length(body) <= 4000),
  received_at     timestamptz not null default now(),
  -- Id en el origen (ej. id del mensaje de Gmail) para no duplicar.
  external_id     text check (char_length(external_id) <= 200),
  status          public.inbox_status not null default 'pending',
  transaction_id  uuid references public.transactions (id) on delete set null,
  created_at      timestamptz not null default now(),
  check (coalesce(title, '') <> '' or coalesce(body, '') <> ''),
  unique (user_id, external_id)
);

alter table public.inbox_items enable row level security;

-- Solo lectura y cambio de estado desde la app; las altas entran por ingest_inbox_item.
create policy "read own inbox" on public.inbox_items
  for select using (user_id = (select auth.uid()));
create policy "update own inbox" on public.inbox_items
  for update using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "delete own inbox" on public.inbox_items
  for delete using (user_id = (select auth.uid()));

create index inbox_items_user_status_idx on public.inbox_items (user_id, status, received_at desc);
create index inbox_items_transaction_id_idx on public.inbox_items (transaction_id);

-- Alta desde /api/ingest ----------------------------------------------------
-- Pública (anon) a propósito: quien no tenga un token válido no puede hacer nada.
-- Devuelve 'created', 'duplicate' o 'unauthorized'.
create function public.ingest_inbox_item(
  p_token        text,
  p_source       text,
  p_app          text default null,
  p_title        text default null,
  p_body         text default null,
  p_received_at  timestamptz default null,
  p_external_id  text default null
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id  uuid;
  v_at       timestamptz := coalesce(p_received_at, now());
begin
  update public.ingest_tokens
     set last_used_at = now()
   where token_hash = encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
  returning user_id into v_user_id;

  if v_user_id is null then
    return 'unauthorized';
  end if;

  -- Android vuelve a disparar la misma notificación cuando se actualiza; y el
  -- mismo id externo (correo) solo entra una vez.
  if exists (
    select 1 from public.inbox_items i
     where i.user_id = v_user_id
       and (
         (p_external_id is not null and i.external_id = p_external_id)
         or (
           i.source = p_source
           and i.app is not distinct from p_app
           and i.title is not distinct from p_title
           and i.body is not distinct from p_body
           and i.received_at > v_at - interval '10 minutes'
           and i.received_at < v_at + interval '10 minutes'
         )
       )
  ) then
    return 'duplicate';
  end if;

  insert into public.inbox_items (user_id, source, app, title, body, received_at, external_id)
  values (v_user_id, p_source, p_app, p_title, p_body, v_at, p_external_id);

  return 'created';
exception
  when unique_violation then
    return 'duplicate';
end;
$$;

revoke execute on function public.ingest_inbox_item(text, text, text, text, text, timestamptz, text) from public;
grant execute on function public.ingest_inbox_item(text, text, text, text, text, timestamptz, text) to anon, authenticated;
