-- Final fix for payment_links public access
-- Ensure payment links can be viewed by anyone without authentication

-- First, disable RLS completely
ALTER TABLE public.payment_links DISABLE ROW LEVEL SECURITY;

-- Verify the table structure
-- SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payment_links';
