-- Check for the specific payment link
SELECT * FROM public.payment_links 
WHERE id = '1c8efef0-4629-42ad-a87d-88e62d7ef57b';

-- Also check all payment links to see their IDs
SELECT id, amount, status, created_at, snippe_reference 
FROM public.payment_links 
ORDER BY created_at DESC 
LIMIT 20;

-- Check RLS status
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'payment_links';

-- Check if there are any policies blocking access
SELECT policyname 
FROM pg_policies
WHERE tablename = 'payment_links';
