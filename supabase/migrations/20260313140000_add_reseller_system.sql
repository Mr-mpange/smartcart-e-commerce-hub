-- Add reseller system
-- Date: 2026-03-13 14:00:00
-- Description: Adds reseller (winga) role and profiles table

-- Add reseller to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('customer', 'vendor', 'delivery_rider', 'admin', 'reseller');
    ELSE
        -- Add reseller to existing enum if not already there
        BEGIN
            ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'reseller';
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

-- Create reseller_profiles table
CREATE TABLE IF NOT EXISTS public.reseller_profiles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    business_name text NOT NULL,
    location text,
    commission_rate decimal(5,2) DEFAULT 10.00, -- Default 10% commission
    total_sales decimal(12,2) DEFAULT 0.00,
    total_commission decimal(12,2) DEFAULT 0.00,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Enable RLS on reseller_profiles
ALTER TABLE public.reseller_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reseller_profiles
CREATE POLICY "Resellers can view own profile" ON public.reseller_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Resellers can update own profile" ON public.reseller_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all reseller profiles" ON public.reseller_profiles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Create updated_at trigger for reseller_profiles
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER handle_reseller_profiles_updated_at
    BEFORE UPDATE ON public.reseller_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create reseller_sales table to track sales and commissions
CREATE TABLE IF NOT EXISTS public.reseller_sales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reseller_id uuid REFERENCES public.reseller_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    sale_amount decimal(12,2) NOT NULL,
    commission_rate decimal(5,2) NOT NULL,
    commission_amount decimal(12,2) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(order_id) -- One commission per order
);

-- Enable RLS on reseller_sales
ALTER TABLE public.reseller_sales ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for reseller_sales
CREATE POLICY "Resellers can view own sales" ON public.reseller_sales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.reseller_profiles 
            WHERE id = reseller_sales.reseller_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage all reseller sales" ON public.reseller_sales
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
    );

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_user_id ON public.reseller_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_reseller_profiles_is_approved ON public.reseller_profiles(is_approved);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller_id ON public.reseller_sales(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_order_id ON public.reseller_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_created_at ON public.reseller_sales(created_at);

-- Create helper function to get reseller profile (for future use)
CREATE OR REPLACE FUNCTION public.get_reseller_profile(user_id_param uuid)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    business_name text,
    location text,
    commission_rate decimal(5,2),
    total_sales decimal(12,2),
    total_commission decimal(12,2),
    is_approved boolean,
    created_at timestamp with time zone,
    updated_at timestamp with time zone
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        rp.id,
        rp.user_id,
        rp.business_name,
        rp.location,
        rp.commission_rate,
        rp.total_sales,
        rp.total_commission,
        rp.is_approved,
        rp.created_at,
        rp.updated_at
    FROM public.reseller_profiles rp
    WHERE rp.user_id = user_id_param;
END;
$$;