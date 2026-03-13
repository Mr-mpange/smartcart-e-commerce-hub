-- Migration: Fix Row Level Security (RLS) policies for profiles table
-- Date: 2026-03-13 12:00:00
-- Description: Fixes 401 Unauthorized errors by updating RLS policies to allow proper access

-- Temporarily disable RLS to clean up existing policies
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Drop all existing conflicting policies to avoid duplicates
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

-- Create comprehensive RLS policies

-- Policy 1: Allow users to manage their own profile (all operations)
CREATE POLICY "Users can manage own profile" ON profiles
    FOR ALL USING (auth.uid() = id);

-- Policy 2: Allow admins to manage all profiles (all operations)
CREATE POLICY "Admins can manage all profiles" ON profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Policy 3: Allow vendors to view their own profile (for vendor dashboard)
CREATE POLICY "Vendors can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'vendor'
        )
    );

-- Policy 4: Allow delivery riders to view their own profile
CREATE POLICY "Riders can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'delivery_rider'
        )
    );

-- Policy 5: Allow customers to view their own profile
CREATE POLICY "Customers can view own profile" ON profiles
    FOR SELECT USING (
        auth.uid() = id AND
        EXISTS (
            SELECT 1 FROM user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'customer'
        )
    );

-- Re-enable RLS with new policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created successfully
-- This will show all policies for the profiles table
DO $$
BEGIN
    RAISE NOTICE 'RLS Policies for profiles table:';
    FOR rec IN 
        SELECT policyname, cmd, permissive 
        FROM pg_policies 
        WHERE tablename = 'profiles' 
        ORDER BY policyname
    LOOP
        RAISE NOTICE 'Policy: % | Command: % | Permissive: %', rec.policyname, rec.cmd, rec.permissive;
    END LOOP;
END $$;