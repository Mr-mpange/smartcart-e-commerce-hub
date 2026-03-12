-- Fix admin profile issues
-- This script ensures the admin user has a proper profile

-- First, check if admin profile exists
SELECT 'Checking admin profiles...' as info;
SELECT p.id, p.full_name, p.phone, au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'admin';

-- Insert or update admin profile
INSERT INTO public.profiles (id, full_name, phone)
SELECT ur.user_id, 'Admin User', '+255683859574'
FROM public.user_roles ur
JOIN auth.users au ON ur.user_id = au.id
WHERE ur.role = 'admin'
ON CONFLICT (id) 
DO UPDATE SET 
  full_name = COALESCE(profiles.full_name, 'Admin User'),
  phone = COALESCE(profiles.phone, '+255683859574');

-- Verify the fix
SELECT 'Admin profiles after fix:' as info;
SELECT p.id, p.full_name, p.phone, au.email
FROM public.profiles p
JOIN auth.users au ON p.id = au.id
JOIN public.user_roles ur ON p.id = ur.user_id
WHERE ur.role = 'admin';