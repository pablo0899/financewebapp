-- Al borrar una cuenta, sus transferencias quedan con to_account_id = null; la
-- regla anterior lo impedía y bloqueaba el borrado. Ahora solo se exige que no
-- tengan categoría ni vayan a la misma cuenta; la app valida ambas cuentas al crear.
alter table public.transactions drop constraint transactions_transfer_check;
alter table public.transactions add constraint transactions_transfer_check
  check (kind <> 'transfer' or (category_id is null and (to_account_id is null or to_account_id <> account_id)));
