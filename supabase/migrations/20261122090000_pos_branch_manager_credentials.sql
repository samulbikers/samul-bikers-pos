-- Samul Bikers POS: branch manager sign-in account.
-- Username: Samul2019   PIN: 2019 (hashed below, never stored in plain text).

do $$
begin
  if exists (select 1 from public.pos_staff_accounts where id = 'acct-manager')
     and not exists (
       select 1 from public.pos_staff_accounts
       where lower(username) = 'samul2019' and id <> 'acct-manager'
     ) then
    update public.pos_staff_accounts
    set name = 'Branch Manager',
        username = 'samul2019',
        pin_hash = crypt('2019', gen_salt('bf')),
        role = 'manager',
        branch_id = coalesce(branch_id, 'br-01'),
        shift = 'Full day',
        source = 'seed',
        updated_at = now()
    where id = 'acct-manager';
  end if;
end $$;

insert into public.pos_staff_accounts (id, name, username, pin_hash, role, branch_id, shift, source)
select 'acct-manager-samul2019', 'Branch Manager', 'samul2019', crypt('2019', gen_salt('bf')), 'manager', 'br-01', 'Full day', 'seed'
where not exists (
  select 1 from public.pos_staff_accounts where lower(username) = 'samul2019'
);
