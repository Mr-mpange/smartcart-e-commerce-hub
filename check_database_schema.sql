-- Check if user_email column exists in login_otps table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'login_otps' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check recent OTP records to see structure
SELECT id, phone_number, otp_code, expires_at, is_used, user_email, created_at
FROM public.login_otps 
ORDER BY created_at DESC 
LIMIT 5;