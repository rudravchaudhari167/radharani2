-- ============================================================================
-- Radha Rani (VRINDAV) — Supabase PostgreSQL schema
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Types / constraints
-- ----------------------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.user_role AS ENUM ('USER', 'ADMIN');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.product_category AS ENUM ('MEN', 'WOMEN', 'UNISEX', 'KIDS', 'ACCESSORIES');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM
    ('ORDER_PLACED','PAYMENT_CONFIRMED','PROCESSING','PACKED','SHIPPED','OUT_FOR_DELIVERY','DELIVERED','CANCELLED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('PENDING','PAID','FAILED','REFUNDED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.shipping_method AS ENUM ('STANDARD','EXPRESS');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.discount_type AS ENUM ('PERCENTAGE','FIXED');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.address_type AS ENUM ('HOME','WORK','OTHER');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ----------------------------------------------------------------------------
-- users (custom email/password login + optional link to Supabase auth users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.users (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id          uuid UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name                  text NOT NULL CHECK (char_length(name) BETWEEN 2 AND 100),
  email                 text NOT NULL UNIQUE CHECK (email ~* '^[^\s@]+@[^\s@]+\.[^\s@]+$'),
  phone                 text,
  password_hash         text NOT NULL,
  role                  public.user_role NOT NULL DEFAULT 'USER',
  is_active             boolean NOT NULL DEFAULT true,
  two_factor_enabled    boolean NOT NULL DEFAULT false,
  two_factor_secret     text NOT NULL DEFAULT '',
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS users_role_idx ON public.users(role);

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.products (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL CHECK (char_length(name) <= 200),
  slug              text NOT NULL UNIQUE,
  description       text NOT NULL,
  price             integer NOT NULL CHECK (price >= 0),          -- rupees (whole)
  old_price         integer CHECK (old_price >= 0),
  category          public.product_category NOT NULL,
  subcategory       text NOT NULL DEFAULT '',
  images            jsonb NOT NULL DEFAULT '[]'::jsonb,           -- string[]
  model_3d          text NOT NULL DEFAULT '',
  sizes             jsonb NOT NULL DEFAULT '[]'::jsonb,           -- string[]
  colors            jsonb NOT NULL DEFAULT '[]'::jsonb,           -- [{name,hex}]
  stock             integer NOT NULL DEFAULT 0 CHECK (stock >= 0),
  sku               text NOT NULL UNIQUE,
  rating            numeric(2,1) NOT NULL DEFAULT 0 CHECK (rating >= 0 AND rating <= 5),
  review_count      integer NOT NULL DEFAULT 0 CHECK (review_count >= 0),
  tags              jsonb NOT NULL DEFAULT '[]'::jsonb,           -- string[]
  featured          boolean NOT NULL DEFAULT false,
  is_new_arrival    boolean NOT NULL DEFAULT false,
  is_active         boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS products_category_idx ON public.products(category);
CREATE INDEX IF NOT EXISTS products_featured_idx ON public.products(featured);
CREATE INDEX IF NOT EXISTS products_new_arrival_idx ON public.products(is_new_arrival);
CREATE INDEX IF NOT EXISTS products_price_idx ON public.products(price);

-- ----------------------------------------------------------------------------
-- carts + cart_items + cart_checkout_pending (one cart per user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.carts (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS carts_user_unique ON public.carts(user_id);

CREATE TABLE IF NOT EXISTS public.cart_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_id           uuid NOT NULL REFERENCES public.carts(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name              text NOT NULL,
  price             integer NOT NULL CHECK (price >= 0),
  image             text NOT NULL DEFAULT '',
  size              text NOT NULL DEFAULT '',
  color             text NOT NULL DEFAULT '',
  quantity          integer NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS cart_items_cart_idx ON public.cart_items(cart_id);

CREATE TABLE IF NOT EXISTS public.cart_checkout_pending (
  cart_id           uuid PRIMARY KEY REFERENCES public.carts(id) ON DELETE CASCADE,
  address_id        uuid NOT NULL,
  shipping_method   public.shipping_method NOT NULL,
  coupon_code       text,
  subtotal          integer NOT NULL,
  discount          integer NOT NULL DEFAULT 0,
  shipping          integer NOT NULL DEFAULT 0,
  total             integer NOT NULL,
  razorpay_order_id text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

-- ----------------------------------------------------------------------------
-- wishlists (one per user)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wishlist_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE CASCADE,
  name              text NOT NULL,
  price             integer NOT NULL CHECK (price >= 0),
  image             text NOT NULL DEFAULT '',
  added_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wishlist_user_idx ON public.wishlist_items(user_id);

-- ----------------------------------------------------------------------------
-- addresses
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.addresses (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  full_name         text NOT NULL,
  phone             text NOT NULL,
  email             text NOT NULL,
  address_line1     text NOT NULL,
  address_line2     text NOT NULL DEFAULT '',
  city              text NOT NULL,
  state             text NOT NULL,
  pincode           text NOT NULL CHECK (pincode ~ '^[0-9]{4,10}$'),
  landmark          text NOT NULL DEFAULT '',
  type              public.address_type NOT NULL DEFAULT 'HOME',
  is_default        boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS addresses_user_idx ON public.addresses(user_id);

-- ----------------------------------------------------------------------------
-- orders + order_items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.orders (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            text NOT NULL UNIQUE,
  user_id             uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subtotal            integer NOT NULL CHECK (subtotal >= 0),
  discount            integer NOT NULL DEFAULT 0 CHECK (discount >= 0),
  coupon_code         text NOT NULL DEFAULT '',
  shipping            integer NOT NULL DEFAULT 0 CHECK (shipping >= 0),
  total               integer NOT NULL CHECK (total >= 0),
  payment_status      public.payment_status NOT NULL DEFAULT 'PENDING',
  payment_id          text NOT NULL DEFAULT '',
  order_status        public.order_status NOT NULL DEFAULT 'ORDER_PLACED',
  address             jsonb NOT NULL,                                  -- IOrderAddress
  shipping_method     public.shipping_method NOT NULL DEFAULT 'STANDARD',
  estimated_delivery  timestamptz NOT NULL,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_user_idx ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(order_status);
CREATE INDEX IF NOT EXISTS orders_created_idx ON public.orders(created_at DESC);

CREATE TABLE IF NOT EXISTS public.order_items (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id        uuid REFERENCES public.products(id) ON DELETE SET NULL,
  name              text NOT NULL,
  price             integer NOT NULL CHECK (price >= 0),
  image             text NOT NULL DEFAULT '',
  size              text NOT NULL DEFAULT '',
  color             text NOT NULL DEFAULT '',
  quantity          integer NOT NULL CHECK (quantity >= 1)
);
CREATE INDEX IF NOT EXISTS order_items_order_idx ON public.order_items(order_id);

-- ----------------------------------------------------------------------------
-- coupons
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.coupons (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code              text NOT NULL UNIQUE,
  description       text NOT NULL DEFAULT '',
  discount_type     public.discount_type NOT NULL,
  discount_value    integer NOT NULL CHECK (discount_value >= 0),
  minimum_order     integer NOT NULL DEFAULT 0 CHECK (minimum_order >= 0),
  maximum_discount  integer NOT NULL DEFAULT 0 CHECK (maximum_discount >= 0),
  expiry_date       timestamptz NOT NULL,
  usage_limit       integer NOT NULL DEFAULT 0 CHECK (usage_limit >= 0),
  used_count        integer NOT NULL DEFAULT 0 CHECK (used_count >= 0),
  active            boolean NOT NULL DEFAULT true,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS coupons_active_idx ON public.coupons(active);
CREATE INDEX IF NOT EXISTS coupons_expiry_idx ON public.coupons(expiry_date);

-- ----------------------------------------------------------------------------
-- reviews
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reviews (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  product_id        uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating            integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           text NOT NULL DEFAULT '' CHECK (char_length(comment) <= 2000),
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, user_id)
);
CREATE INDEX IF NOT EXISTS reviews_product_idx ON public.reviews(product_id, rating);

-- ----------------------------------------------------------------------------
-- audit_logs
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id          uuid REFERENCES public.users(id) ON DELETE SET NULL,
  admin_email       text NOT NULL,
  action            text NOT NULL,
  target            text NOT NULL,
  details           jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address        text NOT NULL DEFAULT '',
  created_at        timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS audit_admin_idx ON public.audit_logs(admin_email);
CREATE INDEX IF NOT EXISTS audit_action_idx ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS audit_created_idx ON public.audit_logs(created_at DESC);

-- ----------------------------------------------------------------------------
-- updated_at trigger
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['users','products','addresses','orders','coupons','reviews']
  LOOP
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at()',
      t || '_updated_at', t);
  END LOOP;
END;
$$;

-- ----------------------------------------------------------------------------
-- RPC helpers used by the API / checkout flow
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.decrement_stock(target_product_id uuid, by_qty integer)
RETURNS void AS $$
BEGIN
  UPDATE public.products
     SET stock = GREATEST(0, stock - by_qty), updated_at = now()
   WHERE id = target_product_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.increment_coupon_used(coupon_name text)
RETURNS void AS $$
BEGIN
  UPDATE public.coupons
     SET used_count = used_count + 1, updated_at = now()
   WHERE code = upper(coupon_name);
END;
$$ LANGUAGE plpgsql;

-- ----------------------------------------------------------------------------
-- Row Level Security
-- ----------------------------------------------------------------------------
ALTER TABLE public.users                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_checkout_pending     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_items            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders                    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs                ENABLE ROW LEVEL SECURITY;

-- Public: read active products + coupons
CREATE POLICY "products public read"  ON public.products  FOR SELECT USING (true);
CREATE POLICY "coupons public read"   ON public.coupons   FOR SELECT USING (active = true);

-- Users can read/update only their own profile
CREATE POLICY "users own all" ON public.users
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Carts / items / checkout pending belong to the owner (cart is owned via users)
CREATE POLICY "carts own" ON public.carts
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "cart_items own" ON public.cart_items
  USING (auth.uid() = (SELECT user_id FROM public.carts WHERE id = cart_items.cart_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.carts WHERE id = cart_items.cart_id));
CREATE POLICY "checkout_pending own" ON public.cart_checkout_pending
  USING (auth.uid() = (SELECT user_id FROM public.carts WHERE id = cart_checkout_pending.cart_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.carts WHERE id = cart_checkout_pending.cart_id));

-- Wishlist
CREATE POLICY "wishlist own" ON public.wishlist_items
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Addresses
CREATE POLICY "addresses own" ON public.addresses
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Orders + items
CREATE POLICY "orders own" ON public.orders
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "order_items own" ON public.order_items
  USING (auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_items.order_id))
  WITH CHECK (auth.uid() = (SELECT user_id FROM public.orders WHERE id = order_items.order_id));

-- Reviews: public read, owner writes
CREATE POLICY "reviews read"  ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews own"   ON public.reviews
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admin-only tables (no public RLS grants — server code uses the service role key)
CREATE POLICY "admin only products write"   ON public.products   FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin only coupons write"    ON public.coupons    FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin only audit insert"     ON public.audit_logs FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin only orders write"     ON public.orders     FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin only order_items write" ON public.order_items FOR ALL USING (false) WITH CHECK (false);
CREATE POLICY "admin only users write"      ON public.users      FOR ALL USING (false) WITH CHECK (false);

-- ----------------------------------------------------------------------------
-- Seed admin helper (run after creating a Supabase Auth user for the admin)
-- ----------------------------------------------------------------------------
-- UPDATE public.users SET role = 'ADMIN' WHERE email = 'admin@vrindav.com';