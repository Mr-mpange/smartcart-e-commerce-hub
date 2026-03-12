-- Quick fix: Add phone number to all admin users
UPDATE public.profiles 
SET phone = '+255683859574'
WHERE id IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
);