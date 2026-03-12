-- Remove customer role from admin user, keep only admin role
-- For user: kilindosaid771@gmail.com

DELETE FROM user_roles 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'kilindosaid771@gmail.com'
) 
AND role = 'customer';

-- Verify the user now has only admin role
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.phone,
    array_agg(ur.role ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindosaid771@gmail.com'
GROUP BY u.id, u.email, p.full_name, p.phone;