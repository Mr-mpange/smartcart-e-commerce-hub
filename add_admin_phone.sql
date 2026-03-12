-- Add phone number to admin profile
-- This will add the phone number +255683859574 to admin accounts

-- First, check current admin profiles
SELECT 'Current admin profiles:' as info;
SELECT p.id, p.full_name, p.phone, au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'admin';

-- Update admin phone number for all admin users (removes the condition to update all admins)
UPDATE public.profiles 
SET phone = '+255683859574'
WHERE id IN (
  SELECT p.id 
  FROM public.profiles p
  JOIN public.user_roles ur ON p.id = ur.user_id
  WHERE ur.role = 'admin'
);

-- Verify the update
SELECT 'Updated admin profiles:' as info;
SELECT p.id, p.full_name, p.phone, au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'admin';