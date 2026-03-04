
-- Fix: Allow authenticated users to insert order items for their own orders
CREATE POLICY "Users can create order items for own orders"
ON public.order_items
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM orders
    WHERE orders.id = order_items.order_id
    AND orders.user_id = auth.uid()
  )
);

-- Create storage bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true);

-- Allow vendors to upload product images
CREATE POLICY "Vendors can upload product images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND has_role(auth.uid(), 'vendor'::app_role)
);

-- Allow anyone to view product images
CREATE POLICY "Anyone can view product images"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-images');

-- Allow vendors to update their own product images
CREATE POLICY "Vendors can update product images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'vendor'::app_role));

-- Allow vendors to delete their own product images
CREATE POLICY "Vendors can delete product images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'product-images' AND has_role(auth.uid(), 'vendor'::app_role));
