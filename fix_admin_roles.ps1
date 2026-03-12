# Fix Admin User Roles - Remove Customer Role, Keep Only Admin

Write-Host "Fixing Admin User Roles" -ForegroundColor Green
Write-Host "Removing customer role from kilindosaid771@gmail.com" -ForegroundColor Yellow
Write-Host "=================================================="

# You need to run this SQL in Supabase Dashboard > SQL Editor:

$sqlScript = @"
-- Remove customer role from admin user, keep only admin role
-- For user: kilindosaid771@gmail.com

DELETE FROM user_roles 
WHERE user_id = (
    SELECT id FROM auth.users WHERE email = 'kilindosaid771@gmail.com'
) 
AND role = 'customer';

-- Verify the user now has only admin role
SELECT 
    u.id,
    u.email,
    p.full_name,
    p.phone,
    array_agg(ur.role ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'kilindosaid771@gmail.com'
GROUP BY u.id, u.email, p.full_name, p.phone;
"@

Write-Host "SQL Script to run in Supabase Dashboard:" -ForegroundColor Cyan
Write-Host $sqlScript -ForegroundColor White

Write-Host ""
Write-Host "Steps:" -ForegroundColor Yellow
Write-Host "1. Go to: https://supabase.com/dashboard/project/qpojzblbodlphwzfpxbi/sql"
Write-Host "2. Copy and paste the SQL above"
Write-Host "3. Click 'Run' to execute"
Write-Host "4. Verify the result shows only 'admin' role"
Write-Host ""
Write-Host "Expected result after running SQL:" -ForegroundColor Green
Write-Host 'roles: [admin]' -ForegroundColor Green
Write-Host "NOT: [admin, customer]" -ForegroundColor Red