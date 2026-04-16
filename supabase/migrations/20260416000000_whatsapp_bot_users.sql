-- ─── WhatsApp Bot Support ────────────────────────────────────────────────────
-- Run this in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/qpojzblbodlphwzfpxbi/sql/new

-- 1. WhatsApp bot users table (no auth.users FK)
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL DEFAULT 'WhatsApp User',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_users DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS whatsapp_users_phone_idx ON public.whatsapp_users(phone);

-- 2. Allow bot orders without auth user
ALTER TABLE public.orders
  ALTER COLUMN user_id DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS whatsapp_user_id UUID REFERENCES public.whatsapp_users(id);

-- 3. Disable RLS on orders/order_items so bot can read/write
ALTER TABLE public.orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items DISABLE ROW LEVEL SECURITY;

-- 4. Allow anon to read active products (bot browsing)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products' AND policyname = 'anon_read_active_products'
  ) THEN
    CREATE POLICY "anon_read_active_products"
      ON public.products FOR SELECT
      TO anon USING (is_active = true);
  END IF;
END $$;
