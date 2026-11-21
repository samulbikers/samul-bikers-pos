-- Samul Bikers POS: branch/staff tables, secure PIN functions and write policies.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Branches
-- ---------------------------------------------------------------------------
create table if not exists public.pos_branches (
  id text primary key,
  name text not null unique,
  city text not null default '',
  address text not null default '',
  phone text not null default '',
  manager text not null default '',
  status text not null default 'Open',
  staff integer not null default 0,
  monthly_revenue numeric(14, 2) not null default 0,
  stock_value numeric(14, 2) not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pos_branches enable row level security;

drop policy if exists pos_manage_branches on public.pos_branches;
create policy pos_manage_branches on public.pos_branches
  for all to anon using (true) with check (true);

insert into public.pos_branches (id, name, city, address, phone, manager, status, staff, monthly_revenue, stock_value)
values
  ('br-01', 'Main branch', 'Nairobi', 'Kirinyaga Road, Stall 14', '+254 720 000 114', 'Miriam Wambui', 'Open', 4, 1206420, 2840000),
  ('br-02', 'Ngara workshop', 'Nairobi', 'Park Road, Unit 6', '+254 733 400 280', 'Esther Njoki', 'Open', 2, 486300, 1120000),
  ('br-03', 'Nakuru outlet', 'Nakuru', 'Kenyatta Avenue, Shop 3', '+254 711 900 337', 'Brian Kiplagat', 'Closing soon', 1, 214800, 690000)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Staff accounts (PINs are hashed; never readable through the API)
-- ---------------------------------------------------------------------------
create table if not exists public.pos_staff_accounts (
  id text primary key,
  name text not null,
  username text not null unique,
  pin_hash text not null,
  role text not null check (role in ('owner', 'manager', 'cashier')),
  branch_id text references public.pos_branches(id) on delete set null,
  shift text not null default '09:00 – 18:00',
  source text not null default 'manager',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.pos_staff_accounts enable row level security;
revoke all on public.pos_staff_accounts from anon, authenticated;

insert into public.pos_staff_accounts (id, name, username, pin_hash, role, branch_id, shift, source)
values
  ('acct-owner', 'Samson Muli', 'samson', crypt('1234', gen_salt('bf')), 'owner', 'br-01', 'Full day', 'seed'),
  ('acct-manager', 'Miriam Wambui', 'miriam', crypt('2468', gen_salt('bf')), 'manager', 'br-01', '08:00 – 17:00', 'seed'),
  ('acct-cashier-lucy', 'Lucy Achieng', 'lucy', crypt('1234', gen_salt('bf')), 'cashier', 'br-01', '09:00 – 18:00', 'seed'),
  ('acct-cashier-esther', 'Esther Njoki', 'esther', crypt('4321', gen_salt('bf')), 'cashier', 'br-02', '09:00 – 18:00', 'seed')
on conflict (id) do nothing;

create or replace function public.pos_staff_login(p_username text, p_pin text)
returns table (id text, name text, username text, role text, branch_id text, shift text, source text)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.name, s.username, s.role, s.branch_id, s.shift, s.source
  from public.pos_staff_accounts s
  where lower(s.username) = lower(trim(p_username))
    and s.pin_hash = crypt(p_pin, s.pin_hash)
  limit 1;
$$;

create or replace function public.pos_staff_list()
returns table (id text, name text, username text, role text, branch_id text, shift text, source text, created_at timestamptz)
language sql
security definer
set search_path = public, extensions
as $$
  select s.id, s.name, s.username, s.role, s.branch_id, s.shift, s.source, s.created_at
  from public.pos_staff_accounts s
  order by s.created_at asc;
$$;

create or replace function public.pos_staff_create(
  p_name text,
  p_username text,
  p_pin text,
  p_role text,
  p_branch_id text,
  p_shift text
)
returns table (id text, name text, username text, role text, branch_id text, shift text, source text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  new_id text := 'acct-' || p_role || '-' || substr(md5(random()::text), 1, 10);
begin
  if p_role not in ('cashier', 'manager') then
    raise exception 'Role must be cashier or manager';
  end if;
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits';
  end if;

  insert into public.pos_staff_accounts (id, name, username, pin_hash, role, branch_id, shift, source)
  values (new_id, trim(p_name), lower(trim(p_username)), crypt(p_pin, gen_salt('bf')), p_role, nullif(p_branch_id, ''), coalesce(nullif(trim(p_shift), ''), '09:00 – 18:00'), 'manager');

  return query
    select s.id, s.name, s.username, s.role, s.branch_id, s.shift, s.source
    from public.pos_staff_accounts s where s.id = new_id;
exception
  when unique_violation then
    raise exception 'An account with that username already exists';
end;
$$;

create or replace function public.pos_staff_update(
  p_id text,
  p_name text,
  p_username text,
  p_role text,
  p_branch_id text,
  p_shift text
)
returns table (id text, name text, username text, role text, branch_id text, shift text, source text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_role not in ('cashier', 'manager') then
    raise exception 'Role must be cashier or manager';
  end if;

  update public.pos_staff_accounts s
  set name = trim(p_name),
      username = lower(trim(p_username)),
      role = p_role,
      branch_id = nullif(p_branch_id, ''),
      shift = coalesce(nullif(trim(p_shift), ''), s.shift),
      updated_at = now()
  where s.id = p_id and s.role <> 'owner';

  if not found then
    raise exception 'Account was not found or cannot be edited';
  end if;

  return query
    select s.id, s.name, s.username, s.role, s.branch_id, s.shift, s.source
    from public.pos_staff_accounts s where s.id = p_id;
exception
  when unique_violation then
    raise exception 'An account with that username already exists';
end;
$$;

create or replace function public.pos_staff_reset_pin(p_id text, p_pin text)
returns table (id text, name text, username text, role text, branch_id text, shift text, source text)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  if p_pin !~ '^[0-9]{4}$' then
    raise exception 'PIN must contain exactly 4 digits';
  end if;

  update public.pos_staff_accounts s
  set pin_hash = crypt(p_pin, gen_salt('bf')), updated_at = now()
  where s.id = p_id and s.role <> 'owner';

  if not found then
    raise exception 'Account was not found or cannot be reset';
  end if;

  return query
    select s.id, s.name, s.username, s.role, s.branch_id, s.shift, s.source
    from public.pos_staff_accounts s where s.id = p_id;
end;
$$;

create or replace function public.pos_staff_delete(p_id text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  delete from public.pos_staff_accounts s where s.id = p_id and s.role <> 'owner';
  if not found then
    raise exception 'Account was not found or cannot be deleted';
  end if;
  return p_id;
end;
$$;

revoke all on function public.pos_staff_login(text, text) from public;
revoke all on function public.pos_staff_list() from public;
revoke all on function public.pos_staff_create(text, text, text, text, text, text) from public;
revoke all on function public.pos_staff_update(text, text, text, text, text, text) from public;
revoke all on function public.pos_staff_reset_pin(text, text) from public;
revoke all on function public.pos_staff_delete(text) from public;

grant execute on function public.pos_staff_login(text, text) to anon, authenticated;
grant execute on function public.pos_staff_list() to anon, authenticated;
grant execute on function public.pos_staff_create(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.pos_staff_update(text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.pos_staff_reset_pin(text, text) to anon, authenticated;
grant execute on function public.pos_staff_delete(text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Write policies for the existing business tables
-- ---------------------------------------------------------------------------
alter table public.products enable row level security;
drop policy if exists pos_manage_products on public.products;
create policy pos_manage_products on public.products for all to anon using (true) with check (true);

alter table public.categories enable row level security;
drop policy if exists pos_manage_categories on public.categories;
create policy pos_manage_categories on public.categories for all to anon using (true) with check (true);

alter table public.pos_customers enable row level security;
drop policy if exists pos_manage_customers on public.pos_customers;
create policy pos_manage_customers on public.pos_customers for all to anon using (true) with check (true);

alter table public.pos_expenses enable row level security;
drop policy if exists pos_manage_expenses on public.pos_expenses;
create policy pos_manage_expenses on public.pos_expenses for all to anon using (true) with check (true);

alter table public.pos_suppliers enable row level security;
drop policy if exists pos_manage_suppliers on public.pos_suppliers;
create policy pos_manage_suppliers on public.pos_suppliers for all to anon using (true) with check (true);

alter table public.pos_purchase_orders enable row level security;
drop policy if exists pos_manage_purchase_orders on public.pos_purchase_orders;
create policy pos_manage_purchase_orders on public.pos_purchase_orders for all to anon using (true) with check (true);

alter table public.pos_inventory_movements enable row level security;
drop policy if exists pos_manage_inventory_movements on public.pos_inventory_movements;
create policy pos_manage_inventory_movements on public.pos_inventory_movements for all to anon using (true) with check (true);

-- ---------------------------------------------------------------------------
-- Table privileges (RLS policies alone are not enough)
-- ---------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;
grant select, insert, update, delete on public.products, public.categories, public.pos_customers, public.pos_expenses, public.pos_suppliers, public.pos_purchase_orders, public.pos_inventory_movements, public.pos_branches to anon, authenticated;
grant select on public.pos_sales, public.pos_sale_items, public.site_settings to anon, authenticated;
