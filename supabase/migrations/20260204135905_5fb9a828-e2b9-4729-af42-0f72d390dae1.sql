-- Enable realtime for orders table
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;

-- Enable realtime for order_items table  
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_items;

-- Add policy to allow vendors to update order_items status
CREATE POLICY "Vendors can update their order items status"
ON public.order_items
FOR UPDATE
USING (auth.uid() = vendor_id);

-- Add policy to allow admins to update orders
CREATE POLICY "Admins can update orders"
ON public.orders
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy to allow delivery riders to update orders they're assigned to
-- First, we need to add a delivery_rider_id column to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS delivery_rider_id uuid;

-- Add policy for delivery riders to view assigned orders
CREATE POLICY "Delivery riders can view assigned orders"
ON public.orders
FOR SELECT
USING (auth.uid() = delivery_rider_id);

-- Add policy for delivery riders to update assigned orders
CREATE POLICY "Delivery riders can update assigned orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = delivery_rider_id);