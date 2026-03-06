
-- Add dispute columns to orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_status text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS dispute_reason text DEFAULT NULL;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS disputed_at timestamptz DEFAULT NULL;

-- Create refund_escrow function (returns funds to buyer wallet)
CREATE OR REPLACE FUNCTION public.refund_escrow(_escrow_id uuid, _admin_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _escrow RECORD;
  _buyer_wallet_id uuid;
BEGIN
  -- Only admins can refund
  IF NOT has_role(_admin_id, 'admin') THEN
    RETURN false;
  END IF;

  SELECT * INTO _escrow FROM public.escrows WHERE id = _escrow_id AND status = 'held';
  IF NOT FOUND THEN RETURN false; END IF;

  -- Get or create buyer wallet
  SELECT id INTO _buyer_wallet_id FROM public.wallets WHERE user_id = _escrow.buyer_id;
  IF NOT FOUND THEN
    INSERT INTO public.wallets (user_id) VALUES (_escrow.buyer_id) RETURNING id INTO _buyer_wallet_id;
  END IF;

  -- Refund full amount to buyer
  UPDATE public.wallets SET balance = balance + _escrow.amount, updated_at = now() WHERE id = _buyer_wallet_id;
  INSERT INTO public.wallet_transactions (wallet_id, type, amount, description, reference_id)
  VALUES (_buyer_wallet_id, 'refund', _escrow.amount, 'Refund from disputed order', _escrow.order_id);

  -- Mark escrow as refunded
  UPDATE public.escrows SET status = 'refunded', released_at = now(), updated_at = now() WHERE id = _escrow_id;

  RETURN true;
END;
$$;
