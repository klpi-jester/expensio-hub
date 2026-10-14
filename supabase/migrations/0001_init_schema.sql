-- ============================================================================
-- Expensio Dine - POS & Customer Self-Ordering MVP
-- Supabase (PostgreSQL) base schema
-- Run in Supabase SQL Editor or via `supabase db push`.
-- ============================================================================

-- Required extensions
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------------
-- 1. App Settings (single-row global currency config)
-- ---------------------------------------------------------------------------
create table if not exists public.settings (
  id              int primary key default 1,
  currency_code   text not null default 'PHP',
  currency_symbol text not null default '₱',
  store_name      text not null default 'Expensio Dine',
  updated_at      timestamptz not null default now(),
  constraint settings_singleton check (id = 1)
);

-- Seed the singleton row
insert into public.settings (id) values (1)
  on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- 2. Categories & Items
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  created_at timestamptz not null default now()
);

-- mode: 'retail' (list view / inventory items) or 'resto' (grid view / dishes)
create table if not exists public.items (
  id             uuid primary key default gen_random_uuid(),
  category_id    uuid references public.categories(id) on delete set null,
  name           text not null,
  sku            text unique,
  mode           text not null check (mode in ('retail', 'resto')),
  buy_price      numeric(10,2) not null default 0.00,
  sell_price     numeric(10,2) not null default 0.00,
  stock_quantity integer not null default 0,
  is_active      boolean not null default true,
  image_url      text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create index if not exists items_category_id_idx on public.items (category_id);
create index if not exists items_mode_idx        on public.items (mode);

-- ---------------------------------------------------------------------------
-- 3. Sales Transactions (completed by cashier at POS terminal)
-- ---------------------------------------------------------------------------
create table if not exists public.sales (
  id            uuid primary key default gen_random_uuid(),
  total_revenue numeric(10,2) not null default 0.00,
  total_cost    numeric(10,2) not null default 0.00,
  total_profit  numeric(10,2) generated always as (total_revenue - total_cost) stored,
  created_at    timestamptz not null default now()
);

create table if not exists public.sale_items (
  id                 uuid primary key default gen_random_uuid(),
  sale_id            uuid not null references public.sales(id) on delete cascade,
  item_id            uuid references public.items(id) on delete set null,
  category_id        uuid references public.categories(id) on delete set null,
  quantity           integer not null check (quantity > 0),
  buy_price_at_sale  numeric(10,2) not null,
  sell_price_at_sale numeric(10,2) not null,
  subtotal           numeric(10,2) generated always as (sell_price_at_sale * quantity) stored,
  created_at         timestamptz not null default now()
);

create index if not exists sale_items_sale_id_idx on public.sale_items (sale_id);

-- ---------------------------------------------------------------------------
-- 4. Guest Self-Ordering & Reservations
-- ---------------------------------------------------------------------------
create table if not exists public.guest_orders (
  id             uuid primary key default gen_random_uuid(),
  reference_code text unique not null,          -- e.g. 'A8F3K9'
  guest_name     text not null,
  guest_mobile   text,
  guest_email    text,
  status         text not null default 'pending'
                 check (status in ('pending','confirmed','completed','cancelled')),
  total_amount   numeric(10,2) not null default 0.00,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.guest_order_items (
  id             uuid primary key default gen_random_uuid(),
  guest_order_id uuid not null references public.guest_orders(id) on delete cascade,
  item_id        uuid references public.items(id) on delete set null,
  quantity       integer not null check (quantity > 0),
  price_at_order numeric(10,2) not null,
  subtotal       numeric(10,2) generated always as (price_at_order * quantity) stored,
  created_at     timestamptz not null default now()
);

create index if not exists guest_order_items_order_id_idx on public.guest_order_items (guest_order_id);

-- ---------------------------------------------------------------------------
-- Realtime: broadcast changes on the live order queue
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table public.guest_orders;
alter publication supabase_realtime add table public.guest_order_items;

-- ---------------------------------------------------------------------------
-- Row Level Security
--   * Authenticated merchant (Google SSO) has full access to operational data
--   * Anonymous users may read menu (categories/items) and insert + read back
--     their own guest order by reference_code
-- ---------------------------------------------------------------------------
alter table public.settings          enable row level security;
alter table public.categories        enable row level security;
alter table public.items             enable row level security;
alter table public.sales             enable row level security;
alter table public.sale_items        enable row level security;
alter table public.guest_orders      enable row level security;
alter table public.guest_order_items enable row level security;

-- Merchant (authenticated) full access
do $$
declare t text;
begin
  foreach t in array array['settings','categories','items','sales','sale_items','guest_orders','guest_order_items']
  loop
    execute format(
      'create policy "authenticated_full_%1$s" on public.%1$s
         for all to authenticated using (true) with check (true);', t);
  end loop;
end $$;

-- Public read of menu for self-ordering
create policy "public_read_categories" on public.categories
  for select to anon using (true);
create policy "public_read_items" on public.items
  for select to anon using (is_active = true);
create policy "public_read_settings" on public.settings
  for select to anon using (true);

-- Public can create a guest order + its items
create policy "public_insert_guest_orders" on public.guest_orders
  for insert to anon with check (true);
create policy "public_insert_guest_order_items" on public.guest_order_items
  for insert to anon with check (true);

-- Public can read a single guest order by its reference_code (order tracking)
create policy "public_read_guest_order_by_ref" on public.guest_orders
  for select to anon using (true);
create policy "public_read_guest_order_items" on public.guest_order_items
  for select to anon using (true);
