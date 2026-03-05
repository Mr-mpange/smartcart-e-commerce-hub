
-- Create wallets table
CREATE TABLE public.wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'TZS',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Create wallet_transactions table
CREATE TABLE public.wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id uuid NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  type text NOT NULL, -- 'top_up', 'escrow_hold', 'escrow_release', 'commission', 'withdrawal', 'refund'
  amount numeric NOT NULL,
  description text,
  reference_id uuid, -- order_id or escrow_id reference
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create escrow table
CREATE TABLE public.escrows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  vendor_id uuid NOT NULL,
  amount numeric NOT NULL,
  commission_rate numeric NOT NULL DEFAULT 0.05,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'held', -- 'held', 'released', 'refunded', 'disputed'
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;

-- Wallet RLS policies
CREATE POLICY "Users can view own wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all wallets" ON public.wallets FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own wallet" ON public.wallets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "System can update wallets" ON public.wallets FOR UPDATE USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'));

-- Wallet transactions RLS
CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = wallet_transactions.wallet_id AND wallets.user_id = auth.uid()));
CREATE POLICY "Admins can view all transactions" ON public.wallet_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can insert own transactions" ON public.wallet_transactions FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.wallets WHERE wallets.id = wallet_transactions.wallet_id AND wallets.user_id = auth.uid()));
CREATE POLICY "Admins can insert transactions" ON public.wallet_transactions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'));

-- Escrow RLS
CREATE POLICY "Buyers can view own escrows" ON public.escrows FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Vendors can view own escrows" ON public.escrows FOR SELECT USING (auth.uid() = vendor_id);
CREATE POLICY "Admins can view all escrows" ON public.escrows FOR SELECT USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated users can create escrows" ON public.escrows FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers can update own escrows" ON public.escrows FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Admins can update escrows" ON public.escrows FOR UPDATE USING (has_role(auth.uid(), 'admin'));

-- Auto-create wallet on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'));
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'customer');

  INSERT INTO public.wallets (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$function$;

-- Edge function to release escrow funds
CREATE OR REPLACE FUNCTION public.release_escrow(_escrow_id uuid, _caller_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _escrow RECORD;
  _vendor_wallet_id uuid;
  _admin_wallet_id uuid;
  _admin_id uuid;
  _vendor_amount numeric;
BEGIN
  SELECT * INTO _escrow FROM public.escrows WHERE id = _escrow_id AND status = 'held';
  IF NOT FOUND THEN RETURN false; END IF;
  
  -- Only buyer or admin can release
  IF _caller_id != _escrow.buyer_id AND NOT has_role(_caller_id, 'admin') THEN
    RETURN false;
  END IF;

  _vendor_amount := _escrow.amount - _escrow.commission_amount;

  -- Get or create vendor wallet
  SELECT id INTO _vendor_wallet_id FROM public.wallets WHERE user_id = _escrow.vendor_id;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id) VALUES (_escrow.vendor_id) RETURNING id INTO _vendor_wallet_id;
  END IF;

  -- Credit vendor
  UPDATE public.wallets SET balance = balance + _vendor_amount, updated_at = now() WHERE id = _vendor_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_vendor_wallet_id, 'escrow_release', _vendor_amount, 'Payment released from escrow', _escrow.order_id);

  -- Credit admin commission (find first admin)
  SELECT ur.user_id INTO _admin_id FROM public.user_roles ur WHERE ur.role = 'admin' LIMIT 1;
  IF _admin_id IS NOT NULL AND _escrow.commission_amount > 0 THEN
    SELECT id INTO _admin_wallet_id FROM public.wallets WHERE user_id = _admin_id;
    IF NOT FOUND THEN
      INSERT INTO public.wallets (user_id) VALUES (_admin_id) RETURNING id INTO _admin_wallet_id;
    END IF;
    UPDATE public.wallets SET balance = balance + _escrow.commission_amount, updated_at = now() WHERE id = _admin_wallet_id;
    INSERT INTO public.wallet_transactions (wallet_id, type, amount, description, reference_id)
    VALUES (_admin_wallet_id, 'commission', _escrow.commission_amount, 'Commission from order', _escrow.order_id);
  END IF;

  -- Mark escrow as released
  UPDATE public.escrows SET status = 'released', released_at = now(), updated_at = now() WHERE id = _escrow_id;

  RETURN true;
END;
$function$;

-- Enable realtime for wallets and escrows
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
ALTER PUBLICATION supabase_realtime ADD TABLE public.escrows;

-- Updated_at triggers
CREATE TRIGGER update_wallets_updated_at BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_escrows_updated_at BEFORE UPDATE ON public.escrows FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
