-- Simple Admin User Setup
-- Run this in Supabase Dashboard > SQL Editor

-- Step 1: First, create the user through Supabase Dashboard > Authentication > Users
-- Email: admin@test.com
-- Password: admin123 (or any password you prefer)
-- Then run this SQL to set up the profile and roles:

-- Insert/Update profile (replace 'USER_ID_HERE' with the actual UUID from auth.users)
INSERT INTO profiles (id, full_name, phone, email, created_at, updated_at)
SELECT 
    id,
    'Admin User',
    '+255683859574',
    'admin@test.com',
    NOW(),
    NOW()
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (id) 
DO UPDATE SET 
    phone = '+255683859574',
    full_name = 'Admin User',
    email = 'admin@test.com',
    updated_at = NOW();

-- Add admin role
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    id,
    'admin',
    NOW()
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Add customer role
INSERT INTO user_roles (user_id, role, created_at)
SELECT 
    id,
    'customer',
    NOW()
FROM auth.users 
WHERE email = 'admin@test.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the setup
SELECT 
    u.id,
    u.email,
    u.created_at as user_created,
    p.full_name,
    p.phone,
    array_agg(ur.role ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@test.com'
GROUP BY u.id, u.email, u.created_at, p.full_name, p.phone;