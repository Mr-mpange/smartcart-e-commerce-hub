
-- Create rider profiles table
CREATE TABLE public.rider_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  full_name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'motorcycle',
  license_number text,
  area_of_operation text,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_profiles ENABLE ROW LEVEL SECURITY;

-- Riders can view own profile
CREATE POLICY "Riders can view own profile"
  ON public.rider_profiles FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Riders can insert own profile
CREATE POLICY "Riders can insert own profile"
  ON public.rider_profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Riders can update own profile
CREATE POLICY "Riders can update own profile"
  ON public.rider_profiles FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- Admins can manage all rider profiles
CREATE POLICY "Admins can manage rider profiles"
  ON public.rider_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Anyone can view approved rider profiles
CREATE POLICY "Anyone can view approved riders"
  ON public.rider_profiles FOR SELECT TO authenticated
  USING (is_approved = true);
