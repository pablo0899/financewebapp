-- Transferencias a cuentas externas (a otra persona o a una cuenta que no está
-- en la app). El dinero sale, así que se guardan como gasto (bajan el saldo y
-- cuentan como egreso del mes) marcados con `external`; la categoría es opcional.
alter table public.transactions add column external boolean not null default false;

alter table public.transactions add constraint transactions_external_check
  check (not external or kind = 'expense');
