-- Simple check for admin users with multiple roles
-- This version doesn't use STRING_AGG to avoid type casting issues

-- Check which users have admin role
SELECT 'Admin Users:' as info;
SELECT ur.user_id, p.full_name, ur.role
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.role = 'admin'
ORDER BY p.full_name;

-- Check if any admin users also have vendor role
SELECT 'Admins with Vendor Role:' as info;
SELECT ur1.user_id, p.full_name, ur1.role as admin_role, ur2.role as other_role
FROM public.user_roles ur1
JOIN public.profiles p ON ur1.user_id = p.id
JOIN public.user_roles ur2 ON ur1.user_id = ur2.user_id
WHERE ur1.role = 'admin' 
AND ur2.role != 'admin'
ORDER BY p.full_name;

-- Count roles per user for admins
SELECT 'Role Count for Admin Users:' as info;
SELECT ur.user_id, p.full_name, COUNT(ur.role) as role_count
FROM public.user_roles ur
JOIN public.profiles p ON ur.user_id = p.id
WHERE ur.user_id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
)
GROUP BY ur.user_id, p.full_name
HAVING COUNT(ur.role) > 1
ORDER BY role_count DESC;

-- Safe cleanup commands (uncomment to execute):
-- Remove vendor roles from admin users
-- DELETE FROM public.user_roles 
-- WHERE role = 'vendor' 
-- AND user_id IN (
--   SELECT user_id FROM public.user_roles WHERE role = 'admin'
-- );

-- Remove vendor profiles for admin users
-- DELETE FROM public.vendor_profiles 
-- WHERE user_id IN (
--   SELECT user_id FROM public.user_roles WHERE role = 'admin'
-- );