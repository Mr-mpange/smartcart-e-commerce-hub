
-- Drop the restrictive policy and recreate it as permissive
DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;

-- Create a permissive SELECT policy for active products
CREATE POLICY "Anyone can view active products" 
ON public.products 
FOR SELECT 
TO anon, authenticated
USING (is_active = true);
