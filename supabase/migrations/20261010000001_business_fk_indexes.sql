-- Las llaves foráneas compuestas (columna, business_id) necesitan índices que
-- las cubran; reemplazan a los índices de una sola columna.
drop index public.biz_expenses_spent_by_idx;
drop index public.biz_expenses_category_idx;
drop index public.biz_sales_item_idx;
drop index public.biz_sales_channel_idx;
drop index public.biz_reimbursements_member_idx;

create index biz_expenses_spent_by_idx on public.biz_expenses (spent_by, business_id);
create index biz_expenses_category_idx on public.biz_expenses (category_id, business_id);
create index biz_sales_item_idx on public.biz_sales (item_id, business_id);
create index biz_sales_channel_idx on public.biz_sales (channel_id, business_id);
create index biz_reimbursements_member_idx on public.biz_reimbursements (member_id, business_id);
