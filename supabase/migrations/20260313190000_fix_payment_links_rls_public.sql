-- Fix payment_links RLS to allow public access
-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Admins can manage all payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can view own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view payment links by ID" ON public.payment_links;
DROP POLICY IF EXISTS "Authenticated users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can update own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can delete own payment links" ON public.payment_links;

-- Create new policies
-- 1. Allow anyone (authenticated or not) to view payment links
CREATE POLICY "Public can view payment links"
ON public.payment_links
FOR SELECT
USING (true);

-- 2. Only authenticated users can create payment links
CREATE POLICY "Authenticated users can create payment links"
ON public.payment_links
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = created_by);

-- 3. Only the creator or admin can update payment links
CREATE POLICY "Users can update own payment links"
ON public.payment_links
FOR UPDATE
TO authenticated
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

-- 4. Only the creator or admin can delete payment links
CREATE POLICY "Users can delete own payment links"
ON public.payment_links
FOR DELETE
TO authenticated
USING (auth.uid() = created_by OR EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));
