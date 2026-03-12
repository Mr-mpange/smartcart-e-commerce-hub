-- Manual cleanup script for specific vendor
-- Run this in Supabase SQL Editor

-- 1. First, find the user_id associated with the vendor (if any)
SELECT 
  vp.id as vendor_id,
  vp.user_id,
  vp.business_name,
  p.full_name
FROM public.vendor_profiles vp
LEFT JOIN public.profiles p ON vp.user_id = p.id
WHERE vp.id = 'bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b';

-- 2. Delete the vendor profile (this is safe to run)
DELETE FROM public.vendor_profiles 
WHERE id = 'bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b';

-- 3. ONLY if you want to delete the entire user account, 
-- replace 'ACTUAL_USER_ID_HERE' with the user_id from step 1
-- DELETE FROM public.user_roles WHERE user_id = 'ACTUAL_USER_ID_HERE';
-- DELETE FROM public.profiles WHERE id = 'ACTUAL_USER_ID_HERE';

-- 4. Clean up duplicate customer roles for admin users
DELETE FROM public.user_roles 
WHERE role = 'customer' 
AND user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'
);

-- 5. Verify cleanup
SELECT 
  vp.id as vendor_id,
  vp.business_name,
  vp.user_id,
  p.full_name,
  array_agg(ur.role) as roles
FROM public.vendor_profiles vp
LEFT JOIN public.profiles p ON vp.user_id = p.id
LEFT JOIN public.user_roles ur ON vp.user_id = ur.user_id
GROUP BY vp.id, vp.business_name, vp.user_id, p.full_name
ORDER BY vp.created_at DESC;