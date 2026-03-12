-- Cleanup Script for SmartCart Admin
-- Run this in Supabase SQL Editor

-- 1. Remove duplicate 'customer' roles from admin users
DELETE FROM user_roles 
WHERE role = 'customer' 
AND user_id IN (
  SELECT user_id 
  FROM user_roles 
  WHERE role = 'admin'
);

-- 2. Delete specific vendor bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b
-- First get the user_id associated with this vendor
DO $$
DECLARE
    vendor_user_id UUID;
BEGIN
    -- Get the user_id for this vendor
    SELECT user_id INTO vendor_user_id 
    FROM vendor_profiles 
    WHERE id = 'bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b';
    
    -- Delete vendor profile
    DELETE FROM vendor_profiles 
    WHERE id = 'bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b';
    
    -- Delete user roles if user_id exists
    IF vendor_user_id IS NOT NULL THEN
        DELETE FROM user_roles 
        WHERE user_id = vendor_user_id;
        
        -- Delete user profile
        DELETE FROM profiles 
        WHERE id = vendor_user_id;
    END IF;
    
    RAISE NOTICE 'Vendor bf6b7b46-70f6-4fe3-9ddd-99fb88936c8b deleted successfully';
END $$;

-- 3. Show remaining admin users (for verification)
SELECT 
    p.full_name,
    p.id as user_id,
    array_agg(ur.role) as roles
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.user_id IN (
    SELECT user_id FROM user_roles WHERE role = 'admin'
)
GROUP BY p.id, p.full_name
ORDER BY p.full_name;