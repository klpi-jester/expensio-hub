-- Expensio Dine — Migration 0002: Multi-tenant stores + item media + ownership RLS
-- Run after 0001_init_schema.sql (pgcrypto is already enabled there).
-- Idempotent: every CREATE is guarded and every policy is dropped before recreate,
-- so you can paste this whole file into the Supabase SQL editor and run it in one go.

-- ============================================================================
-- 1. STORES (tenant root, one per merchant)
-- ============================================================================
CREATE TABLE IF NOT EXISTS stores (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug        TEXT UNIQUE NOT NULL,          -- public URL segment: /menu/<slug>
  name        TEXT NOT NULL,
  description TEXT,
  logo_url    TEXT,
  cover_url   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Lower-cased unique slug index for lookups by /menu/[slug].
CREATE UNIQUE INDEX IF NOT EXISTS stores_slug_lower_key ON stores (lower(slug));
CREATE INDEX IF NOT EXISTS stores_owner_idx ON stores (owner_id);

-- ============================================================================
-- 2. ADD store_id (nullable) + item media columns to existing tables
-- ============================================================================
ALTER TABLE categories   ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE items        ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE sales        ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;
ALTER TABLE guest_orders ADD COLUMN IF NOT EXISTS store_id UUID REFERENCES stores(id) ON DELETE CASCADE;

-- Item description + image (image_url may already exist from 0001; IF NOT EXISTS keeps it safe).
ALTER TABLE items ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE items ADD COLUMN IF NOT EXISTS image_url   TEXT;

CREATE INDEX IF NOT EXISTS categories_store_idx   ON categories (store_id);
CREATE INDEX IF NOT EXISTS items_store_idx        ON items (store_id);
CREATE INDEX IF NOT EXISTS sales_store_idx        ON sales (store_id);
CREATE INDEX IF NOT EXISTS guest_orders_store_idx ON guest_orders (store_id);

-- child tables inherit tenancy through their parents (sale_items -> sales,
-- guest_order_items -> guest_orders), so no extra column is required there.

-- ============================================================================
-- 3. RESET RLS for tenant-owned tables and apply ownership-scoped policies
--    (drop the blunt authenticated_full_* and unrestricted public_* policies
--     from 0001 first)
-- ============================================================================
ALTER TABLE categories        ENABLE ROW LEVEL SECURITY;
ALTER TABLE items             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales             ENABLE ROW LEVEL SECURITY;
ALTER TABLE sale_items        ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_orders      ENABLE ROW LEVEL SECURITY;
ALTER TABLE guest_order_items ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- 0001 merchant full-access policies (replaced by ownership-scoped ones)
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_categories     ON categories';
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_items          ON items';
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_sales          ON sales';
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_sale_items     ON sale_items';
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_guest_orders   ON guest_orders';
  EXECUTE 'DROP POLICY IF EXISTS authenticated_full_guest_order_items ON guest_order_items';
  -- 0001 unrestricted anon-insert policies (replaced by store-scoped versions)
  EXECUTE 'DROP POLICY IF EXISTS public_insert_guest_orders       ON guest_orders';
  EXECUTE 'DROP POLICY IF EXISTS public_insert_guest_order_items  ON guest_order_items';
END $$;

-- ---- stores: owner full access; public can read any store ----
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS stores_owner_all ON stores;
CREATE POLICY stores_owner_all ON stores
  FOR ALL
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS stores_public_read ON stores;
CREATE POLICY stores_public_read ON stores
  FOR SELECT USING (true);

-- ---- categories: owner writes rows whose store they own; public reads ----
DROP POLICY IF EXISTS categories_owner_all ON categories;
CREATE POLICY categories_owner_all ON categories
  FOR ALL
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = categories.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stores s WHERE s.id = categories.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS public_read_categories ON categories;
CREATE POLICY public_read_categories ON categories
  FOR SELECT USING (store_id IS NOT NULL);

-- ---- items ----
DROP POLICY IF EXISTS items_owner_all ON items;
CREATE POLICY items_owner_all ON items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = items.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stores s WHERE s.id = items.store_id AND s.owner_id = auth.uid()));

DROP POLICY IF EXISTS public_read_items ON items;
CREATE POLICY public_read_items ON items
  FOR SELECT USING (store_id IS NOT NULL AND is_active = true);

-- ---- sales ----
DROP POLICY IF EXISTS sales_owner_all ON sales;
CREATE POLICY sales_owner_all ON sales
  FOR ALL
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = sales.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stores s WHERE s.id = sales.store_id AND s.owner_id = auth.uid()));

-- ---- sale_items: scoped through the parent sale's store ownership ----
DROP POLICY IF EXISTS sale_items_owner_all ON sale_items;
CREATE POLICY sale_items_owner_all ON sale_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM sales sa JOIN stores s ON s.id = sa.store_id
    WHERE sa.id = sale_items.sale_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM sales sa JOIN stores s ON s.id = sa.store_id
    WHERE sa.id = sale_items.sale_id AND s.owner_id = auth.uid()
  ));

-- ---- guest_orders ----
DROP POLICY IF EXISTS guest_orders_owner_all ON guest_orders;
CREATE POLICY guest_orders_owner_all ON guest_orders
  FOR ALL
  USING (EXISTS (SELECT 1 FROM stores s WHERE s.id = guest_orders.store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM stores s WHERE s.id = guest_orders.store_id AND s.owner_id = auth.uid()));

-- anon may create an order only for an existing store (kept tenancy-safe)
DROP POLICY IF EXISTS anon_insert_guest_orders ON guest_orders;
CREATE POLICY anon_insert_guest_orders ON guest_orders
  FOR INSERT TO anon
  WITH CHECK (
    store_id IS NOT NULL
    AND EXISTS (SELECT 1 FROM stores s WHERE s.id = guest_orders.store_id)
  );

DROP POLICY IF EXISTS public_read_guest_order_status ON guest_orders;
CREATE POLICY public_read_guest_order_status ON guest_orders
  FOR SELECT TO anon
  USING (store_id IS NOT NULL);

-- ---- guest_order_items: scoped through the parent order (column: guest_order_id) ----
DROP POLICY IF EXISTS guest_order_items_owner_all ON guest_order_items;
CREATE POLICY guest_order_items_owner_all ON guest_order_items
  FOR ALL
  USING (EXISTS (
    SELECT 1 FROM guest_orders go JOIN stores s ON s.id = go.store_id
    WHERE go.id = guest_order_items.guest_order_id AND s.owner_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM guest_orders go JOIN stores s ON s.id = go.store_id
    WHERE go.id = guest_order_items.guest_order_id AND s.owner_id = auth.uid()
  ));

DROP POLICY IF EXISTS public_read_guest_order_items ON guest_order_items;
CREATE POLICY public_read_guest_order_items ON guest_order_items
  FOR SELECT TO anon
  USING (EXISTS (SELECT 1 FROM guest_orders go WHERE go.id = guest_order_items.guest_order_id));

DROP POLICY IF EXISTS anon_insert_guest_order_items ON guest_order_items;
CREATE POLICY anon_insert_guest_order_items ON guest_order_items
  FOR INSERT TO anon
  WITH CHECK (EXISTS (SELECT 1 FROM guest_orders go WHERE go.id = guest_order_items.guest_order_id));

-- settings stays a global singleton (merchant-readable) — unchanged from 0001.

-- ============================================================================
-- 4. STORAGE — public bucket "store_assets" (logos, covers, item photos)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('store_assets', 'store_assets', true)
ON CONFLICT (id) DO NOTHING;

-- Public read of store assets (needed by the guest menu).
DROP POLICY IF EXISTS store_assets_public_read ON storage.objects;
CREATE POLICY store_assets_public_read ON storage.objects
  FOR SELECT USING (bucket_id = 'store_assets');

-- Authenticated merchants may upload into store_assets under a folder
-- "<owner_id>/...". Path is validated in the upload Server Action.
DROP POLICY IF EXISTS store_assets_auth_insert ON storage.objects;
CREATE POLICY store_assets_auth_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'store_assets'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

-- Merchants may overwrite/remove their own assets.
DROP POLICY IF EXISTS store_assets_auth_update ON storage.objects;
CREATE POLICY store_assets_auth_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'store_assets'
    AND split_part(name, '/', 1) = (auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'store_assets'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

DROP POLICY IF EXISTS store_assets_auth_delete ON storage.objects;
CREATE POLICY store_assets_auth_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'store_assets'
    AND split_part(name, '/', 1) = (auth.uid())::text
  );

-- ============================================================================
-- 5. REALTIME — guest_orders stays published (already added in 0001).
-- ============================================================================
