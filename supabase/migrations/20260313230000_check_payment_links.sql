-- Check if payment links table exists and has data
-- Run these queries in Supabase SQL Editor to diagnose the issue

-- 1. Check if payment_links table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'payment_links'
) as table_exists;

-- 2. Check total count of payment links
SELECT COUNT(*) as total_payment_links FROM public.payment_links;

-- 3. Check if specific payment link exists
SELECT * FROM public.payment_links 
WHERE id = '1c8efef0-4629-42ad-a87d-88e62d7ef57b';

-- 4. List all payment links (most recent first)
SELECT id, amount, status, created_by, created_at, snippe_reference 
FROM public.payment_links 
ORDER BY created_at DESC 
LIMIT 20;

-- 5. Check RLS status on payment_links table
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_links';

-- 6. Check all policies on payment_links table
SELECT schemaname, tablename, policyname, permissive, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'payment_links';

-- 7. Check payment_links table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'payment_links' 
ORDER BY ordinal_position;

-- 8. Check if there are any payment links created in the last 24 hours
SELECT id, amount, status, created_at 
FROM public.payment_links 
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- 9. Check payment links by status
SELECT status, COUNT(*) as count 
FROM public.payment_links 
GROUP BY status;

-- 10. Check payment links created by specific user (replace with actual user_id)
SELECT id, amount, status, created_at 
FROM public.payment_links 
WHERE created_by = 'USER_ID_HERE'
ORDER BY created_at DESC;
