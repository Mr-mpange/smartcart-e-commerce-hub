-- Simple RLS fix for profiles table
-- Date: 2026-03-13 13:00:00
-- Description: Fixes 401 Unauthorized errors by updating RLS policies

-- Temporarily disable RLS to clean up existing policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on email" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on email" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can insert any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "Admins can delete any profile" ON profiles;
DROP POLICY IF EXISTS "Allow authenticated users full access to own profile" ON profiles;
DROP POLICY IF EXISTS "Allow admins full access to all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Vendors can view own profile" ON profiles;
DROP POLICY IF EXISTS "Riders can view own profile" ON profiles;
DROP POLICY IF EXISTS "Customers can view own profile" ON profiles;

-- Create simple, comprehensive RLS policies
CREATE POLICY "Allow users to manage their own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

CREATE POLICY "Allow admins to manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;