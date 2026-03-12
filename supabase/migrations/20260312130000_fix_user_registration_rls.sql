-- Fix RLS policies to allow user registration
-- Users should be able to create their initial role and vendor profile

-- Drop and recreate user_roles policies
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON public.user_roles;

-- Allow users to view their own roles
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to insert their own initial role during registration
CREATE POLICY "Users can insert own role"
  ON public.user_roles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow admins to manage all roles
CREATE POLICY "Admins can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Drop and recreate vendor_profiles policies
DROP POLICY IF EXISTS "Anyone can view approved vendor profiles" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can view own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can insert own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Vendors can update own profile" ON public.vendor_profiles;
DROP POLICY IF EXISTS "Admins can manage vendor profiles" ON public.vendor_profiles;

-- Allow anyone to view approved vendor profiles
CREATE POLICY "Anyone can view approved vendor profiles"
  ON public.vendor_profiles FOR SELECT
  TO authenticated
  USING (is_approved = TRUE);

-- Allow vendors to view their own profile
CREATE POLICY "Vendors can view own profile"
  ON public.vendor_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow users to create vendor profile during registration (without requiring vendor role first)
CREATE POLICY "Users can create vendor profile"
  ON public.vendor_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Allow vendors to update their own profile
CREATE POLICY "Vendors can update own profile"
  ON public.vendor_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Allow admins to manage all vendor profiles
CREATE POLICY "Admins can manage vendor profiles"
  ON public.vendor_profiles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));