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
    max_markup_percentage decimal(5,2) DEFAULT 0.00, -- Maximum markup allowed (0% = can't increase price)
    total_sales decimal(12,2) DEFAULT 0.00,
    total_commission decimal(12,2) DEFAULT 0.00,
    is_approved boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id)
);

-- Create reseller_products table to track reseller-specific pricing
CREATE TABLE IF NOT EXISTS public.reseller_products (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reseller_id uuid REFERENCES public.reseller_profiles(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    reseller_price decimal(12,2) NOT NULL,
    original_price decimal(12,2) NOT NULL, -- Store original vendor price for validation
    markup_percentage decimal(5,2) DEFAULT 0.00,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(reseller_id, product_id),
    -- Constraint to ensure reseller price doesn't exceed original price + allowed markup
    CONSTRAINT valid_reseller_price CHECK (
        reseller_price <= original_price * (1 + (markup_percentage / 100))
    )
);

-- Enable RLS on reseller_profiles
ALTER TABLE public.reseller_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resellers can view own profile" ON public.reseller_profiles;
DROP POLICY IF EXISTS "Resellers can update own profile" ON public.reseller_profiles;
DROP POLICY IF EXISTS "Admins can manage all reseller profiles" ON public.reseller_profiles;

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

-- Enable RLS on reseller_products
ALTER TABLE public.reseller_products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resellers can manage own products" ON public.reseller_products;
DROP POLICY IF EXISTS "Customers can view active reseller products" ON public.reseller_products;
DROP POLICY IF EXISTS "Admins can manage all reseller products" ON public.reseller_products;

-- Create RLS policies for reseller_products
CREATE POLICY "Resellers can manage own products" ON public.reseller_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.reseller_profiles 
            WHERE id = reseller_products.reseller_id 
            AND user_id = auth.uid()
        )
    );

CREATE POLICY "Customers can view active reseller products" ON public.reseller_products
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage all reseller products" ON public.reseller_products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.user_roles 
            WHERE user_id = auth.uid() 
            AND role = 'admin'
        )
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

CREATE TRIGGER handle_reseller_products_updated_at
    BEFORE UPDATE ON public.reseller_products
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Create reseller_sales table to track sales and commissions
CREATE TABLE IF NOT EXISTS public.reseller_sales (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    reseller_id uuid REFERENCES public.reseller_profiles(id) ON DELETE CASCADE NOT NULL,
    order_id uuid REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
    product_id uuid REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    original_price decimal(12,2) NOT NULL, -- Vendor's original price
    reseller_price decimal(12,2) NOT NULL, -- Price reseller sold at
    sale_amount decimal(12,2) NOT NULL, -- Total amount for this item (reseller_price * quantity)
    commission_rate decimal(5,2) NOT NULL,
    commission_amount decimal(12,2) NOT NULL,
    quantity integer NOT NULL DEFAULT 1,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(order_id, product_id) -- One commission per product per order
);

-- Enable RLS on reseller_sales
ALTER TABLE public.reseller_sales ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Resellers can view own sales" ON public.reseller_sales;
DROP POLICY IF EXISTS "Admins can manage all reseller sales" ON public.reseller_sales;

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
CREATE INDEX IF NOT EXISTS idx_reseller_products_reseller_id ON public.reseller_products(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_products_product_id ON public.reseller_products(product_id);
CREATE INDEX IF NOT EXISTS idx_reseller_products_is_active ON public.reseller_products(is_active);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_reseller_id ON public.reseller_sales(reseller_id);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_order_id ON public.reseller_sales(order_id);
CREATE INDEX IF NOT EXISTS idx_reseller_sales_created_at ON public.reseller_sales(created_at);

-- Create function to validate reseller pricing
DROP FUNCTION IF EXISTS public.validate_reseller_price(uuid, uuid, decimal);

CREATE OR REPLACE FUNCTION public.validate_reseller_price(
    p_reseller_id uuid,
    p_product_id uuid,
    p_reseller_price decimal(12,2)
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_original_price decimal(12,2);
    v_max_markup decimal(5,2);
    v_max_allowed_price decimal(12,2);
BEGIN
    -- Get original product price
    SELECT price INTO v_original_price
    FROM public.products
    WHERE id = p_product_id;
    
    IF v_original_price IS NULL THEN
        RETURN false; -- Product not found
    END IF;
    
    -- Get reseller's maximum allowed markup
    SELECT max_markup_percentage INTO v_max_markup
    FROM public.reseller_profiles
    WHERE id = p_reseller_id;
    
    IF v_max_markup IS NULL THEN
        RETURN false; -- Reseller not found
    END IF;
    
    -- Calculate maximum allowed price
    v_max_allowed_price := v_original_price * (1 + (v_max_markup / 100));
    
    -- Check if reseller price is within allowed range
    RETURN p_reseller_price <= v_max_allowed_price;
END;
$$;

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