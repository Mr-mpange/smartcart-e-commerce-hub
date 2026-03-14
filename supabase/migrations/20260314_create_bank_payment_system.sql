-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  business_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  bank_name text NOT NULL,
  account_name text NOT NULL,
  account_number text NOT NULL,
  branch text,
  swift_code text,
  iban text,
  is_primary boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bank_payments table
CREATE TABLE IF NOT EXISTS public.bank_payments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  amount decimal(12,2) NOT NULL,
  bank_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  reference_number text UNIQUE,
  payment_method text CHECK (payment_method IN ('bank_transfer', 'mobile_banking', 'bank_ussd', 'card')),
  status text DEFAULT 'pending_verification' CHECK (status IN ('pending_verification', 'verified', 'failed', 'cancelled')),
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create bank_payment_verifications table
CREATE TABLE IF NOT EXISTS public.bank_payment_verifications (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_payment_id uuid REFERENCES public.bank_payments(id) ON DELETE CASCADE NOT NULL,
  transaction_reference text,
  bank_confirmation_code text,
  verified_amount decimal(12,2),
  verified_date timestamp with time zone,
  verified_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method text CHECK (verification_method IN ('manual', 'auto', 'bank_api')),
  notes text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_payment_verifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for bank_accounts
CREATE POLICY "Users can view own bank accounts" ON public.bank_accounts
  FOR SELECT USING (auth.uid() = business_id);

CREATE POLICY "Users can manage own bank accounts" ON public.bank_accounts
  FOR ALL USING (auth.uid() = business_id);

CREATE POLICY "Admins can view all bank accounts" ON public.bank_accounts
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for bank_payments
CREATE POLICY "Users can view own bank payments" ON public.bank_payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create bank payments" ON public.bank_payments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all bank payments" ON public.bank_payments
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can verify bank payments" ON public.bank_payments
  FOR UPDATE USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create RLS policies for bank_payment_verifications
CREATE POLICY "Users can view own verifications" ON public.bank_payment_verifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bank_payments
      WHERE bank_payments.id = bank_payment_verifications.bank_payment_id
      AND bank_payments.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage verifications" ON public.bank_payment_verifications
  FOR ALL USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_bank_accounts_business_id ON public.bank_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_is_primary ON public.bank_accounts(is_primary);
CREATE INDEX IF NOT EXISTS idx_bank_payments_order_id ON public.bank_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_bank_payments_user_id ON public.bank_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_bank_payments_status ON public.bank_payments(status);
CREATE INDEX IF NOT EXISTS idx_bank_payments_created_at ON public.bank_payments(created_at);
CREATE INDEX IF NOT EXISTS idx_bank_payment_verifications_bank_payment_id ON public.bank_payment_verifications(bank_payment_id);

-- Create updated_at trigger for bank_accounts
CREATE OR REPLACE FUNCTION public.handle_bank_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_bank_accounts_updated_at ON public.bank_accounts;
CREATE TRIGGER handle_bank_accounts_updated_at
  BEFORE UPDATE ON public.bank_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bank_accounts_updated_at();

-- Create updated_at trigger for bank_payments
CREATE OR REPLACE FUNCTION public.handle_bank_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_bank_payments_updated_at ON public.bank_payments;
CREATE TRIGGER handle_bank_payments_updated_at
  BEFORE UPDATE ON public.bank_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_bank_payments_updated_at();
