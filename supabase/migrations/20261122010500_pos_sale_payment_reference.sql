-- Persist the M-Pesa / PayHero payment reference on each receipt.

alter table public.pos_sales
  add column if not exists payment_reference text;

create or replace function public.pos_set_sale_payment_reference(
  p_sale_id uuid,
  p_reference text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.pos_sales
  set payment_reference = nullif(trim(p_reference), '')
  where id = p_sale_id;
$$;

revoke all on function public.pos_set_sale_payment_reference(uuid, text) from public;
grant execute on function public.pos_set_sale_payment_reference(uuid, text) to anon, authenticated;
