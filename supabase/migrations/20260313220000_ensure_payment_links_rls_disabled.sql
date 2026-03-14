-- Ensure payment_links RLS is completely disabled for public access
-- This allows anyone to view payment links without authentication

-- First, drop ALL policies
DROP POLICY IF EXISTS "Public can view payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Admins can manage all payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can view own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view payment links by ID" ON public.payment_links;
DROP POLICY IF EXISTS "Authenticated users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete own payment links" ON public.payment_links;

-- Disable RLS completely
ALTER TABLE public.payment_links DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
-- SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'payment_links';
