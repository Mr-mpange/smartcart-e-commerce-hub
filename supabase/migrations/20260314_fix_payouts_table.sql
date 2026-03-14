-- Ensure payouts table exists with proper structure
DROP TABLE IF EXISTS public.payouts CASCADE;

CREATE TABLE public.payouts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  requested_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_phone text NOT NULL,
  recipient_name text,
  amount decimal(12,2) NOT NULL,
  payout_type text DEFAULT 'single',
  status text DEFAULT 'processing',
  approval_required boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at timestamp with time zone,
  rejected_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  rejected_at timestamp with time zone,
  rejection_reason text,
  description text,
  wallet_id uuid,
  tembo_reference text,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payouts_select_own" ON public.payouts FOR SELECT USING (auth.uid() = requested_by);
CREATE POLICY "payouts_insert_own" ON public.payouts FOR INSERT WITH CHECK (auth.uid() = requested_by);
CREATE POLICY "payouts_admin_all" ON public.payouts FOR ALL USING (true);

CREATE INDEX idx_payouts_requested_by ON public.payouts(requested_by);
CREATE INDEX idx_payouts_status ON public.payouts(status);
CREATE INDEX idx_payouts_created_at ON public.payouts(created_at);
