-- La función solo la debe ejecutar el trigger de auth.users, no la API pública.
revoke execute on function public.seed_default_categories() from public, anon, authenticated;

-- Índices para las llaves foráneas (joins y borrados en cascada).
create index transactions_category_id_idx on public.transactions (category_id);
create index budgets_category_id_idx on public.budgets (category_id);
