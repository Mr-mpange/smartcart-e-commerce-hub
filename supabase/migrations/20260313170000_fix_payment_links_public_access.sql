-- Fix payment_links RLS to allow public access to view payment links by ID
-- This allows unauthenticated users to view payment link details when they have the link ID

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view own payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Users can create payment links" ON public.payment_links;
DROP POLICY IF EXISTS "Anyone can view payment links by ID" ON public.payment_links;

-- Add new policies
-- Allow anyone (authenticated or not) to view a specific payment link by ID
CREATE POLICY "Anyone can view payment links by ID" ON public.payment_links
  FOR SELECT
  USING (true);

-- Only authenticated users can create payment links
CREATE POLICY "Authenticated users can create payment links" ON public.payment_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Only the creator or admin can update their payment links
CREATE POLICY "Users can update own payment links" ON public.payment_links
  FOR UPDATE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));

-- Only the creator or admin can delete their payment links
CREATE POLICY "Users can delete own payment links" ON public.payment_links
  FOR DELETE TO authenticated
  USING (auth.uid() = created_by OR has_role(auth.uid(), 'admin'::app_role));
