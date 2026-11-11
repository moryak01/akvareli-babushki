-- =========================================================
-- Акварели бабушки — схема базы заказов (Supabase / Postgres)
-- Выполнить один раз в Supabase → SQL Editor.
-- =========================================================

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  artwork_id int not null,
  artwork_title text not null,
  price int not null check (price >= 0),
  customer_name text not null,
  contact text not null,
  comment text,
  status text not null default 'new'
    check (status in ('new', 'confirmed', 'paid', 'shipped', 'completed', 'cancelled')),
  admin_note text,
  consent_at timestamptz,
  updated_at timestamptz not null default now()
);

create index if not exists orders_created_at_idx on public.orders (created_at desc);
create index if not exists orders_status_idx on public.orders (status);

-- Автообновление updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists orders_touch_updated_at on public.orders;
create trigger orders_touch_updated_at
  before update on public.orders
  for each row execute function public.touch_updated_at();

-- =========================================================
-- RLS: анонимный ключ не видит заказы.
-- Читать и менять может только вошедший владелец.
-- Вставка идёт только из Netlify Function с service_role key,
-- поэтому insert-политика не создаётся.
-- =========================================================

alter table public.orders enable row level security;

drop policy if exists "owner can read orders" on public.orders;
create policy "owner can read orders"
  on public.orders for select
  to authenticated
  using (true);

drop policy if exists "owner can update orders" on public.orders;
create policy "owner can update orders"
  on public.orders for update
  to authenticated
  using (true)
  with check (true);

-- После выполнения:
-- 1. Authentication → Users → Add user: e-mail владельца + пароль.
-- 2. Authentication → Sign In / Providers → Email:
--    выключить "Enable Sign Ups", включить "Email" (пароль).
-- 3. Не включать публичную регистрацию.
