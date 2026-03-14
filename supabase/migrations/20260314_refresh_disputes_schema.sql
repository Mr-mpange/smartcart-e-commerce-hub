-- Refresh disputes table schema cache
-- This migration ensures the disputes table is properly recognized

-- Verify disputes table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'disputes'
  ) THEN
    -- Create disputes table if it doesn't exist
    CREATE TABLE public.disputes (
      id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
      stripe_dispute_id text UNIQUE NOT NULL,
      charge_id text NOT NULL,
      amount decimal(12,2) NOT NULL,
      reason text,
      status text,
      evidence_due_by timestamp with time zone,
      created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
    );

    -- Enable RLS
    ALTER TABLE public.disputes ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Admins can view disputes" ON public.disputes
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.user_roles
          WHERE user_id = auth.uid() AND role = 'admin'
        )
      );

    CREATE POLICY "Service role can manage disputes" ON public.disputes
      FOR ALL USING (true);

    -- Create index
    CREATE INDEX idx_disputes_stripe_dispute_id ON public.disputes(stripe_dispute_id);
  END IF;
END $$;

-- Add comment to refresh schema cache
COMMENT ON TABLE public.disputes IS 'Stores Stripe dispute information for payment disputes';
