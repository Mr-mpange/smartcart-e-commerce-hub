
-- Create dispute messages table
CREATE TABLE public.dispute_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  message text NOT NULL,
  is_admin boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.dispute_messages ENABLE ROW LEVEL SECURITY;

-- Buyers can view messages on their own orders
CREATE POLICY "Buyers can view dispute messages on own orders"
  ON public.dispute_messages FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.orders WHERE orders.id = dispute_messages.order_id AND orders.user_id = auth.uid()
  ));

-- Buyers can insert messages on their own orders
CREATE POLICY "Buyers can insert dispute messages on own orders"
  ON public.dispute_messages FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.orders WHERE orders.id = dispute_messages.order_id AND orders.user_id = auth.uid())
  );

-- Admins can view all dispute messages
CREATE POLICY "Admins can view all dispute messages"
  ON public.dispute_messages FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Admins can insert dispute messages
CREATE POLICY "Admins can insert dispute messages"
  ON public.dispute_messages FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND auth.uid() = user_id);

-- Enable realtime for dispute messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.dispute_messages;
