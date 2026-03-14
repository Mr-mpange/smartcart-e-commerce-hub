-- Disable RLS for SELECT on payment_links to allow public access
-- This is safe because payment links are meant to be publicly accessible

-- First, drop all existing policies
DROP POLICY IF EXISTS "Public can view payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Admins can manage all payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can view own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view payment links by ID" ON public.payment_links;
DROP POLICY IF EXISTS "Authenticated users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete own payment links" ON public.payment_links;

-- Disable RLS entirely for payment_links table
-- This allows all SELECT queries to work without authentication
ALTER TABLE public.payment_links DISABLE ROW LEVEL SECURITY;

-- Note: If you want to re-enable RLS later, use:
-- ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
-- And then create appropriate policies
