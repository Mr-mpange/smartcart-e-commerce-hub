
-- Payment Links table
CREATE TABLE public.payment_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  description text,
  status text NOT NULL DEFAULT 'active',
  checkout_url text,
  snippe_reference text,
  order_id uuid REFERENCES public.orders(id),
  recipient_phone text,
  recipient_name text,
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Payouts table
CREATE TABLE public.payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by uuid NOT NULL,
  recipient_phone text NOT NULL,
  recipient_name text,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  payout_type text NOT NULL DEFAULT 'single',
  status text NOT NULL DEFAULT 'pending',
  tembo_reference text,
  approval_required boolean NOT NULL DEFAULT false,
  approved_by uuid,
  approved_at timestamp with time zone,
  rejected_by uuid,
  rejected_at timestamp with time zone,
  rejection_reason text,
  description text,
  wallet_id uuid REFERENCES public.wallets(id),
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Ledger Entries table (consolidated financial ledger)
CREATE TABLE public.ledger_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_type text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  sender_name text,
  sender_id uuid,
  receiver_name text,
  receiver_id uuid,
  reference text,
  reference_id uuid,
  status text NOT NULL DEFAULT 'completed',
  description text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;

-- Payment Links RLS
CREATE POLICY "Admins can manage all payment links" ON public.payment_links
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own payment links" ON public.payment_links
  FOR SELECT TO authenticated
  USING (auth.uid() = created_by);

CREATE POLICY "Users can create payment links" ON public.payment_links
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Payouts RLS
CREATE POLICY "Admins can manage all payouts" ON public.payouts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own payouts" ON public.payouts
  FOR SELECT TO authenticated
  USING (auth.uid() = requested_by);

CREATE POLICY "Users can create payouts" ON public.payouts
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = requested_by);

-- Ledger RLS
CREATE POLICY "Admins can view all ledger entries" ON public.ledger_entries
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own ledger entries" ON public.ledger_entries
  FOR SELECT TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Updated_at triggers
CREATE TRIGGER update_payment_links_updated_at BEFORE UPDATE ON public.payment_links
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payouts_updated_at BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable realtime for payment monitoring
ALTER PUBLICATION supabase_realtime ADD TABLE public.payment_links;
ALTER PUBLICATION supabase_realtime ADD TABLE public.payouts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ledger_entries;
