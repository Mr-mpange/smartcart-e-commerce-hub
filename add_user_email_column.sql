-- Add user_email column to login_otps table for easier OTP verification
ALTER TABLE public.login_otps 
ADD COLUMN IF NOT EXISTS user_email TEXT;

-- Create index for faster email-based OTP lookups
CREATE INDEX IF NOT EXISTS idx_login_otps_email_code ON public.login_otps(user_email, otp_code);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'login_otps' 
AND table_schema = 'public';