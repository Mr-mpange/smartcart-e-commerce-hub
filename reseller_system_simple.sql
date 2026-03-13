-- Simple Reseller System Setup
-- Copy and paste this into Supabase SQL Editor

-- Add reseller role to enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reseller';

-- Create reseller profiles table
CREATE TABLE IF NOT EXISTS public.reseller_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_name text NOT NULL,
    location text,
    commission_rate decimal(5,2) DEFAULT 10.00,
    max_markup_percentage decimal(5,2) DEFAULT 0.00,
    total_sales decimal(12,2) DEFAULT 0.00,
    total_commission decimal(12,2) DEFAULT 0.00,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.reseller_profiles ENABLE ROW LEVEL SECURITY;

-- Create basic RLS policy
DROP POLICY IF EXISTS "Resellers can view own profile" ON public.reseller_profiles;
CREATE POLICY "Resellers can view own profile" ON public.reseller_profiles
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can manage all reseller profiles" ON public.reseller_profiles;
CREATE POLICY "Admins can manage all reseller profiles" ON public.reseller_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );