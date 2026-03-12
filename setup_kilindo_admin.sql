-- Create Admin User for Testing
-- This script creates an admin user with email kilindosaid771@gmail.com and phone +255683859574

-- First, let's check if the user already exists
DO $$
DECLARE
    admin_user_id UUID;
    existing_profile_count INTEGER;
    existing_role_count INTEGER;
BEGIN
    -- Check if we already have an admin user
    SELECT COUNT(*) INTO existing_profile_count 
    FROM auth.users 
    WHERE email = 'kilindosaid771@gmail.com';
    
    IF existing_profile_count = 0 THEN
        -- Create the auth user (this would normally be done through Supabase Auth)
        -- Note: In production, you should create users through the Supabase dashboard or Auth API
        RAISE NOTICE 'User kilindosaid771@gmail.com does not exist in auth.users table';
        RAISE NOTICE 'Please create this user through Supabase Dashboard > Authentication > Users';
        RAISE NOTICE 'Or use the Auth API to create the user first';
    ELSE
        -- Get the user ID
        SELECT id INTO admin_user_id 
        FROM auth.users 
        WHERE email = 'kilindosaid771@gmail.com';
        
        RAISE NOTICE 'Found existing user kilindosaid771@gmail.com with ID: %', admin_user_id;
        
        -- Check if profile exists
        SELECT COUNT(*) INTO existing_profile_count 
        FROM profiles 
        WHERE id = admin_user_id;
        
        IF existing_profile_count = 0 THEN
            -- Create profile
            INSERT INTO profiles (id, full_name, phone, email, created_at, updated_at)
            VALUES (
                admin_user_id,
                'Kilindo Said Admin',
                '+255683859574',
                'kilindosaid771@gmail.com',
                NOW(),
                NOW()
            );
            RAISE NOTICE 'Created profile for admin user';
        ELSE
            -- Update existing profile to ensure phone number is set
            UPDATE profiles 
            SET 
                phone = '+255683859574',
                full_name = COALESCE(full_name, 'Kilindo Said Admin'),
                email = COALESCE(email, 'kilindosaid771@gmail.com'),
                updated_at = NOW()
            WHERE id = admin_user_id;
            RAISE NOTICE 'Updated existing profile for admin user';
        END IF;
        
        -- Check if admin role exists
        SELECT COUNT(*) INTO existing_role_count 
        FROM user_roles 
        WHERE user_id = admin_user_id AND role = 'admin';
        
        IF existing_role_count = 0 THEN
            -- Add admin role
            INSERT INTO user_roles (user_id, role, created_at)
            VALUES (admin_user_id, 'admin', NOW())
            ON CONFLICT (user_id, role) DO NOTHING;
            RAISE NOTICE 'Added admin role to user';
        ELSE
            RAISE NOTICE 'User already has admin role';
        END IF;
        
        -- Also add customer role for completeness
        INSERT INTO user_roles (user_id, role, created_at)
        VALUES (admin_user_id, 'customer', NOW())
        ON CONFLICT (user_id, role) DO NOTHING;
        
        RAISE NOTICE 'Admin user setup complete!';
        RAISE NOTICE 'Email: kilindosaid771@gmail.com';
        RAISE NOTICE 'Phone: +255683859574';
        RAISE NOTICE 'Roles: admin, customer';
    END IF;
END $$;

-- Verify the setup
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.phone,
    array_agg(ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindosaid771@gmail.com'
GROUP BY u.id, u.email, p.full_name, p.phone;