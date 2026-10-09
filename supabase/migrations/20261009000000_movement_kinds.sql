-- Nuevos tipos de movimiento. Van en su propia migración porque Postgres no
-- permite usar un valor de enum en la misma transacción en que se agrega.
--   transfer:   dinero entre dos cuentas propias (ej. pagar la tarjeta desde MP)
--   adjustment: corrección para que el saldo coincida con el real
alter type public.movement_kind add value 'transfer';
alter type public.movement_kind add value 'adjustment';
