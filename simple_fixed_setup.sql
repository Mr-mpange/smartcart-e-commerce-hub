-- Simple Fixed Admin User Setup for kilindosaid771@gmail.com
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: First, create the user through Supabase Dashboard > Authentication > Users
-- Email: kilindosaid771@gmail.com
-- Password: (choose any password you prefer)
-- Auto Confirm User: ✅ Check this box
-- Then run this SQL:

-- Insert/Update profile (without email column since it doesn't exist)
INSERT INTO profiles (id, full_name, phone, created_at, updated_at)
SELECT 
    id,
    'Kilindo Said Admin',
    '+255683859574',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'kilindosaid771@gmail.com'
ON CONFLICT (id) 
DO UPDATE SET 
    phone = '+255683859574',
    full_name = 'Kilindo Said Admin',
    updated_at = NOW();

-- Add admin role
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    id,
    'admin',
    NOW()
FROM auth.users 
WHERE email = 'kilindosaid771@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add customer role
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    id,
    'customer',
    NOW()
FROM auth.users 
WHERE email = 'kilindosaid771@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the setup
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    u.email_confirmed_at,
    p.full_name,
    p.phone,
    array_agg(ur.role ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindosaid771@gmail.com'
GROUP BY u.id, u.email, u.created_at, u.email_confirmed_at, p.full_name, p.phone;