-- Fix bank payment system triggers with correct syntax

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
