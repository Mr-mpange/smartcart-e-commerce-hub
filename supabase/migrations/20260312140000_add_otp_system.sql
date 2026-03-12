-- Create OTP system for secure login
CREATE TABLE public.login_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_used BOOLEAN DEFAULT FALSE,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies for OTP table
ALTER TABLE public.login_otps ENABLE ROW LEVEL SECURITY;

-- Allow users to insert OTP requests (for generating OTP)
CREATE POLICY "Anyone can request OTP"
  ON public.login_otps FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Allow users to verify their own OTP
CREATE POLICY "Users can verify OTP"
  ON public.login_otps FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Allow updating OTP status (marking as used)
CREATE POLICY "Allow OTP verification updates"
  ON public.login_otps FOR UPDATE
  TO anon, authenticated
  USING (TRUE);

-- Add updated_at trigger
CREATE TRIGGER update_login_otps_updated_at
  BEFORE UPDATE ON public.login_otps
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add phone number to profiles table if not exists
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT;

-- Create index for faster OTP lookups
CREATE INDEX idx_login_otps_phone_code ON public.login_otps(phone_number, otp_code);
CREATE INDEX idx_login_otps_expires ON public.login_otps(expires_at);

-- Clean up expired OTPs function
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS void AS $$
BEGIN
  DELETE FROM public.login_otps 
  WHERE expires_at < NOW() - INTERVAL '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;