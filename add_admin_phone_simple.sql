-- Simple command to add phone to admin
-- Run this in your Supabase SQL editor

-- Check current admin (replace with your admin email)
SELECT p.*, au.email 
FROM profiles p 
JOIN auth.users au ON p.id = au.id 
JOIN user_roles ur ON p.id = ur.user_id 
WHERE ur.role = 'admin';

-- Add phone to admin (update the email to match your admin)
UPDATE profiles 
SET phone = '+255683859574' 
WHERE id = (
  SELECT p.id 
  FROM profiles p 
  JOIN auth.users au ON p.id = au.id 
  JOIN user_roles ur ON p.id = ur.user_id 
  WHERE ur.role = 'admin' 
  AND au.email = 'your-admin-email@example.com'  -- Replace with actual admin email
);

-- Or update ALL admin users
-- UPDATE profiles SET phone = '+255683859574' WHERE id IN (SELECT user_id FROM user_roles WHERE role = 'admin');