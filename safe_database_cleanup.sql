-- Safe Database Cleanup Script
-- Run these queries one by one to fix database issues

-- Step 1: Check for orphaned user_roles (run this first to see what will be deleted)
SELECT ur.*, 'WILL BE DELETED' as status
FROM public.user_roles ur
LEFT JOIN auth.users au ON ur.user_id = au.id
WHERE au.id IS NULL;

-- Step 2: Delete orphaned user_roles (only run after reviewing step 1 results)
-- DELETE FROM public.user_roles 
-- WHERE user_id NOT IN (SELECT id FROM auth.users);

-- Step 3: Check for profiles without corresponding auth users
SELECT p.*, 'WILL BE DELETED' as status
FROM public.profiles p
LEFT JOIN auth.users au ON p.id = au.id
WHERE au.id IS NULL;

-- Step 4: Delete orphaned profiles (only run after reviewing step 3 results)
-- DELETE FROM public.profiles 
-- WHERE id NOT IN (SELECT id FROM auth.users);

-- Step 5: Clean up expired OTPs (safe to run)
DELETE FROM public.login_otps 
WHERE expires_at < NOW() - INTERVAL '1 hour';

-- Step 6: Fix phone number formatting (safe to run)
UPDATE public.profiles 
SET phone = CASE 
  WHEN phone IS NOT NULL AND phone != '' AND NOT phone LIKE '+%' THEN '+255' || LTRIM(phone, '0')
  ELSE phone 
END
WHERE phone IS NOT NULL AND phone != '' AND NOT phone LIKE '+%';

-- Step 7: Ensure vendor profiles have proper approval status (safe to run)
UPDATE public.vendor_profiles 
SET is_approved = COALESCE(is_approved, false)
WHERE is_approved IS NULL;

-- Step 8: Remove duplicate user roles (safe to run)
DELETE FROM public.user_roles a 
USING public.user_roles b 
WHERE a.id < b.id 
AND a.user_id = b.user_id 
AND a.role = b.role;

-- Step 9: Add customer role to users without any role (safe to run)
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'customer'
FROM public.profiles p
LEFT JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IS NULL
AND EXISTS (SELECT 1 FROM auth.users au WHERE au.id = p.id);

-- Step 10: Deactivate products from unapproved vendors (safe to run)
UPDATE public.products 
SET is_active = false 
WHERE vendor_id NOT IN (
  SELECT user_id FROM public.vendor_profiles WHERE is_approved = true
) AND is_active = true;