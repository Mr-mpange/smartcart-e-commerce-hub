-- Migration: Simple RLS fix for profiles table (fallback)
-- Date: 2026-03-13 12:00:01
-- Description: Simplified RLS policies if the comprehensive version fails

-- Only run this if the previous migration failed
-- You can check by running: SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Temporarily disable RLS
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'profiles'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON profiles';
    END LOOP;
END $$;

-- Create two simple, permissive policies

-- Policy 1: Allow authenticated users full access to their own profile
CREATE POLICY "authenticated_users_own_profile" ON profiles
    FOR ALL 
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 2: Allow admins full access to all profiles
CREATE POLICY "admins_all_profiles" ON profiles
    FOR ALL 
    USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Test the policies work
DO $$
BEGIN
    -- Check if policies exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'authenticated_users_own_profile') THEN
        RAISE NOTICE 'SUCCESS: authenticated_users_own_profile policy created';
    ELSE
        RAISE EXCEPTION 'FAILED: authenticated_users_own_profile policy not created';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'admins_all_profiles') THEN
        RAISE NOTICE 'SUCCESS: admins_all_profiles policy created';
    ELSE
        RAISE EXCEPTION 'FAILED: admins_all_profiles policy not created';
    END IF;
    
    RAISE NOTICE 'Simple RLS fix completed successfully!';
END $$;