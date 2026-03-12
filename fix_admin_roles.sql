-- Fix admin users who might have multiple roles
-- This ensures admins only have admin role

-- First, let's see which users have both admin and vendor roles
SELECT ur1.user_id, p.full_name, p.phone,
       STRING_AGG(ur1.role::text, ', ') as all_roles
FROM public.user_roles ur1
JOIN public.profiles p ON ur1.user_id = p.id
WHERE ur1.user_id IN (
  SELECT user_id 
  FROM public.user_roles 
  WHERE role = 'admin'
)
GROUP BY ur1.user_id, p.full_name, p.phone
HAVING COUNT(DISTINCT ur1.role) > 1;

-- Remove vendor roles from admin users (uncomment to execute)
-- DELETE FROM public.user_roles 
-- WHERE role = 'vendor' 
-- AND user_id IN (
--   SELECT user_id 
--   FROM public.user_roles 
--   WHERE role = 'admin'
-- );

-- Remove vendor profiles for admin users (uncomment to execute)
-- DELETE FROM public.vendor_profiles 
-- WHERE user_id IN (
--   SELECT user_id 
--   FROM public.user_roles 
--   WHERE role = 'admin'
-- );