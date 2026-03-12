-- Quick fix for immediate database issues

-- Clean up expired OTPs
DELETE FROM public.login_otps 
WHERE expires_at < NOW() - INTERVAL '1 hour';

-- Fix phone number formatting
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone IS NOT NULL AND phone != '' AND NOT phone LIKE '+%' THEN '+255' || LTRIM(phone, '0')
  ELSE phone 
END
WHERE phone IS NOT NULL AND phone != '' AND NOT phone LIKE '+%';

-- Ensure vendor profiles have proper approval status
UPDATE public.vendor_profiles 
SET is_approved = COALESCE(is_approved, false)
WHERE is_approved IS NULL;

-- Remove duplicate user roles
DELETE FROM public.user_roles a 
USING public.user_roles b 
WHERE a.id < b.id 
AND a.user_id = b.user_id 
AND a.role = b.role;