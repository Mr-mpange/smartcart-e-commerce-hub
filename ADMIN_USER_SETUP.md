# 👤 Admin User Setup Guide

## 🎯 Goal
Create an admin user with email `admin@test.com` and phone `+255683859574` for testing the OTP system.

## 📋 Step-by-Step Instructions

### Step 1: Create User in Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard/project/qpojzblbodlphwzfpxbi/auth/users)
2. Click **"Add User"** or **"Invite User"**
3. Fill in the details:
   - **Email**: `admin@test.com`
   - **Password**: `admin123` (or any password you prefer)
   - **Auto Confirm User**: ✅ Check this box
4. Click **"Send Invitation"** or **"Create User"**

### Step 2: Run SQL Setup Script
1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/qpojzblbodlphwzfpxbi/sql)
2. Copy and paste the contents of `simple_admin_setup.sql`
3. Click **"Run"** to execute the SQL
4. Verify the output shows the user with admin role and phone number

### Step 3: Verify Setup
Run this query in the SQL Editor to confirm everything is set up correctly:

```sql
SELECT 
    u.id,
    u.email,
    u.email_confirmed_at,
    p.full_name,
    p.phone,
    array_agg(ur.role ORDER BY ur.role) as roles
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
LEFT JOIN user_roles ur ON u.id = ur.user_id
WHERE u.email = 'admin@test.com'
GROUP BY u.id, u.email, u.email_confirmed_at, p.full_name, p.phone;
```

Expected result:
- ✅ Email: admin@test.com
- ✅ Phone: +255683859574
- ✅ Roles: [admin, customer]
- ✅ Email confirmed: should have a timestamp

## 🧪 Test the Setup

### Option 1: Use the Test Files
1. Open `test_briq_key.html` in your browser
2. Click "Check API Key Config"
3. Should now find the user and proceed to test SMS

### Option 2: Command Line Test
```powershell
$headers = @{ 
    "Authorization" = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg"
    "Content-Type" = "application/json" 
}
$body = '{"action":"generate_otp","email":"admin@test.com"}'
Invoke-WebRequest -Uri "https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms" -Method POST -Headers $headers -Body $body
```

## 🔧 Troubleshooting

### If user creation fails:
- Make sure you're logged into the correct Supabase project
- Check that email confirmations are disabled or the user is auto-confirmed
- Verify the project URL is correct: qpojzblbodlphwzfpxbi

### If SQL script fails:
- Make sure the user was created in Step 1 first
- Check that the `profiles` and `user_roles` tables exist
- Run the verification query to see what's missing

### If OTP test still fails:
- Verify BRIQ_API_KEY is set in Supabase Dashboard > Settings > Edge Functions
- Check that the phone number format is correct: +255683859574
- Look at function logs in Supabase Dashboard > Functions > briq-sms > Logs

## 🎉 Success Indicators

After completing all steps, you should be able to:
- ✅ Generate OTP for admin@test.com
- ✅ Receive SMS on +255683859574 (if BRIQ_API_KEY is configured)
- ✅ Verify OTP codes
- ✅ Login to the web app with admin@test.com

## 📱 Next Steps

Once the admin user is set up:
1. Test the OTP system with `test_briq_key.html`
2. Set up BRIQ_API_KEY if not already done
3. Test the full login flow in the web application
4. Deploy remaining Edge Functions if needed