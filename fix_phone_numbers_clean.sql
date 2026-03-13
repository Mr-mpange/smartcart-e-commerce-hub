-- Fix existing phone numbers to use consistent international format
-- This will convert phone numbers starting with 0 to +255 format

UPDATE public.profiles 
SET phone = CASE 
  WHEN phone LIKE '0%' THEN '+255' || SUBSTRING(phone FROM 2)
  WHEN phone ~ '^[0-9]{9}$' THEN '+255' || phone
  WHEN phone LIKE '255%' AND NOT phone LIKE '+%' THEN '+' || phone
  ELSE phone
END
WHERE phone IS NOT NULL 
AND (
  phone LIKE '0%' 
  OR phone ~ '^[0-9]{9}$' 
  OR (phone LIKE '255%' AND NOT phone LIKE '+%')
);

-- Check the results
SELECT id, phone, 
  CASE 
    WHEN phone LIKE '+255%' THEN 'Correct format'
    ELSE 'Needs fixing'
  END as status
FROM public.profiles 
WHERE phone IS NOT NULL
ORDER BY phone;