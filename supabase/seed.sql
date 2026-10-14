-- Expensio Dine — seed.sql
-- Populates 3 demo restaurants (Jester's Grill, Brew & Bake, Ramen House) with
-- categories, items (incl. images/descriptions) and sample guest orders.
--
-- HOW TO RUN
--   Supabase dashboard → SQL Editor → paste everything → Run.
--   Or CLI:  supabase db query --linked -f supabase/seed.sql
--
-- Requires migration 0002 (stores + store_id columns) to be applied first.
-- owner_id resolution: auth.uid() is NULL inside the SQL editor, so we fall
-- back to the earliest auth.users row. Sign up in the app first so a real
-- merchant owns these stores (otherwise the seed raises a helpful error).

DO $$
DECLARE
  v_owner uuid := COALESCE(
    auth.uid(),
    (SELECT id FROM auth.users ORDER BY created_at LIMIT 1)
  );
  v_jester uuid := '11111111-1111-1111-1111-111111111111';
  v_brew   uuid := '22222222-2222-2222-2222-222222222222';
  v_ramen  uuid := '33333333-3333-3333-3333-333333333333';
BEGIN
  IF v_owner IS NULL THEN
    RAISE EXCEPTION 'No auth user found. Create a merchant account (sign up in the app), then re-run this seed.';
  END IF;

  -- ---- Idempotent cleanup (store_id FKs cascade children) -----------------
  DELETE FROM guest_orders
    WHERE reference_code IN ('EXP-8F9K2', 'EXP-3M4P1')
       OR guest_name LIKE 'Test Guest%';
  DELETE FROM stores
    WHERE slug IN ('jester-grill', 'brew-and-bake', 'ramen-house');

  -- ---- Stores -------------------------------------------------------------
  INSERT INTO stores (id, owner_id, slug, name, description, logo_url, cover_url) VALUES
    (v_jester, v_owner, 'jester-grill', 'Jester’s Artisanal Grill',
     'Gourmet handcrafted burgers, sizzlers, and premium sides.',
     'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=300&q=80',
     'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80'),
    (v_brew, v_owner, 'brew-and-bake', 'Brew & Bake Cafe',
     'Specialty espresso beverages, fresh croissants, and daily pastries.',
     'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?auto=format&fit=crop&w=300&q=80',
     'https://images.unsplash.com/photo-1442512595331-e89e73853f31?auto=format&fit=crop&w=1200&q=80'),
    (v_ramen, v_owner, 'ramen-house', 'Nori & Broth Ramen Den',
     'Authentic slow-simmered tonkotsu ramen and Japanese tapas.',
     'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=300&q=80',
     'https://images.unsplash.com/photo-1591814468924-caf88d1232e1?auto=format&fit=crop&w=1200&q=80')
  ON CONFLICT (slug) DO NOTHING;

  -- ---- Categories ---------------------------------------------------------
  INSERT INTO categories (id, store_id, name) VALUES
    ('c1111111-1111-1111-1111-111111111111', v_jester, 'Burgers & Mains'),
    ('c1111112-1111-1111-1111-111111111111', v_jester, 'Drinks & Shakes'),
    ('c2222221-2222-2222-2222-222222222222', v_brew,   'Espresso Bar'),
    ('c2222222-2222-2222-2222-222222222222', v_brew,   'Fresh Pastries'),
    ('c3333331-3333-3333-3333-333333333333', v_ramen,  'Ramen Bowls'),
    ('c3333332-3333-3333-3333-333333333333', v_ramen,  'Appetizers & Sides')
  ON CONFLICT (id) DO NOTHING;

  -- ---- Items --------------------------------------------------------------
  INSERT INTO items (store_id, category_id, name, description, mode, buy_price, sell_price, stock_quantity, image_url) VALUES
    (v_jester, 'c1111111-1111-1111-1111-111111111111', 'Truffle Mushroom Burger',
     'Prime beef patty, black truffle aioli, swiss cheese, caramelized onions.', 'resto', 120.00, 320.00, 50,
     'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80'),
    (v_jester, 'c1111111-1111-1111-1111-111111111111', 'Classic Smoky Bacon Cheeseburger',
     'Angus beef, smoked bacon, cheddar, house barbecue sauce.', 'resto', 100.00, 280.00, 40,
     'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=600&q=80'),
    (v_jester, 'c1111112-1111-1111-1111-111111111111', 'Craft Iced Latte',
     'Double shot espresso, creamy fresh milk, dark caramel drip.', 'resto', 40.00, 160.00, 100,
     'https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80'),

    (v_brew, 'c2222221-2222-2222-2222-222222222222', 'Spanish Latte',
     'Signature espresso with condensed milk and steamed textured velvet milk.', 'resto', 35.00, 150.00, 80,
     'https://images.unsplash.com/photo-1541167760496-1628856ab772?auto=format&fit=crop&w=600&q=80'),
    (v_brew, 'c2222222-2222-2222-2222-222222222222', 'Butter Croissant',
     'Flaky, 81-layer French butter croissant baked fresh daily.', 'resto', 25.00, 110.00, 30,
     'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80'),

    (v_ramen, 'c3333331-3333-3333-3333-333333333333', 'Signature Tonkotsu Ramen',
     '24-hour pork bone broth, chashu pork belly, ajitama egg, wood ear mushroom.', 'resto', 130.00, 380.00, 60,
     'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?auto=format&fit=crop&w=600&q=80'),
    (v_ramen, 'c3333332-3333-3333-3333-333333333333', 'Pork Gyoza (6pcs)',
     'Pan-seared Japanese pork dumplings with chili ponzu dipping sauce.', 'resto', 50.00, 180.00, 45,
     'https://images.unsplash.com/photo-1496116218417-1a781b1c416c?auto=format&fit=crop&w=600&q=80');

  -- ---- Sample guest orders for the live queue demo ------------------------
  INSERT INTO guest_orders (store_id, reference_code, guest_name, guest_mobile, guest_email, status, total_amount) VALUES
    (v_jester, 'EXP-8F9K2', 'Amanda L.', '+63 917 816 0000', 'amanda@example.com', 'pending',   480.00),
    (v_jester, 'EXP-3M4P1', 'Jester T.',  '+63 918 555 1234', 'jester@example.com', 'confirmed', 320.00);
END $$;

-- Preview the seeded public menu slugs:
--   /menu/jester-grill   /menu/brew-and-bake   /menu/ramen-house
