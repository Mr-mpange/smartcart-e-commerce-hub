-- Add unique constraint to prevent duplicate payouts
-- This ensures that if the same payout is submitted twice, the database will reject it

ALTER TABLE public.payouts 
ADD CONSTRAINT unique_payout_transaction_ref UNIQUE (id);

-- Add index for faster lookups by tembo_reference
CREATE INDEX IF NOT EXISTS idx_payouts_tembo_reference ON public.payouts(tembo_reference);

-- Add index for faster lookups by recipient_phone and amount (to detect potential duplicates)
CREATE INDEX IF NOT EXISTS idx_payouts_recipient_amount ON public.payouts(recipient_phone, amount, created_at DESC);
