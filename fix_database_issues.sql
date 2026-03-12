-- Fix database issues mentioned in the summary

-- 1. Clean up any user_roles with invalid user_id references
DELETE FROM public.user_roles 
WHERE user_id NOT IN (
  SELECT id FROM auth.users
) OR user_id = '00000000-0000-0000-0000-000000000000';

-- 2. Clean up any profiles with invalid foreign key references
DELETE FROM public.profiles WHERE id NOT IN (
  SELECT id FROM auth.users
);

-- 3. Ensure all profiles have proper phone number format
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone IS NOT NULL AND phone != '' AND NOT phone LIKE '+%' THEN '+255' || LTRIM(phone, '0')
  ELSE phone 
END
WHERE phone IS NOT NULL AND phone != '';

-- 4. Clean up expired OTPs (if table exists)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'login_otps') THEN
    DELETE FROM public.login_otps WHERE expires_at < NOW() - INTERVAL '1 hour';
  END IF;
END $$;

-- 5. Ensure vendor profiles have proper approval status
UPDATE public.vendor_profiles 
SET is_approved = COALESCE(is_approved, false)
WHERE is_approved IS NULL;

-- 6. Clean up any duplicate user roles
DELETE FROM public.user_roles a USING public.user_roles b 
WHERE a.id < b.id 
AND a.user_id = b.user_id 
AND a.role = b.role;

-- 7. Ensure all users have at least one role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'customer'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL
AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id);

-- 8. Update products to ensure they have valid vendor references
UPDATE public.products 
SET is_active = false 
WHERE vendor_id NOT IN (
  SELECT user_id FROM public.vendor_profiles WHERE is_approved = true
);

COMMIT;