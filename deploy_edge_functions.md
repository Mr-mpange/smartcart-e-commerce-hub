# 🚀 Edge Functions Deployment Guide

## 📋 Prerequisites
Make sure you have:
- Supabase CLI installed: `npm install -g supabase`
- Logged in to Supabase: `supabase login`
- Project linked: `supabase link --project-ref qpojzblbodlphwzfpxbi`

## 🔧 Environment Variables Required
Before deploying, ensure these environment variables are set in your Supabase project:

### Required for briq-sms function:
```bash
# Set in Supabase Dashboard > Settings > Edge Functions > Environment Variables
BRIQ_API_KEY=your_briq_api_key_here
SUPABASE_URL=https://qpojzblbodlphwzfpxbi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

## 📦 Deploy All Edge Functions

### 1. Deploy briq-sms (Priority - Contains OTP system)
```bash
supabase functions deploy briq-sms --project-ref qpojzblbodlphwzfpxbi
```

### 2. Deploy Payment Functions
```bash
supabase functions deploy create-payment-link --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy snippe-payment --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy snippe-webhook --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy zenopay-payment --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy zenopay-webhook --project-ref qpojzblbodlphwzfpxbi
supabase functions deploy tembo-webhook --project-ref qpojzblbodlphwzfpxbi
```

### 3. Deploy Other Functions
```bash
supabase functions deploy auto-release-escrow --project-ref qpojzblbodlphwzfpxbi
```

### 4. Check tembo-payout function
```bash
# First check if this function has an index.ts file
ls supabase/functions/tembo-payout/
# If it exists, deploy it:
supabase functions deploy tembo-payout --project-ref qpojzblbodlphwzfpxbi
```

## 🧪 Test Deployed Functions

### Test briq-sms (OTP System)
```bash
# Test OTP Generation
curl -L -X POST 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  --data '{
    "action": "generate_otp",
    "email": "admin@test.com"
  }'

# Test Direct SMS
curl -L -X POST 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  --data '{
    "phone_number": "+255683859574",
    "message": "Test SMS from deployed function"
  }'
```

### Test Other Functions
```bash
# Test create-payment-link
curl -L -X POST 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/create-payment-link' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  --data '{"amount": 1000, "currency": "TZS"}'
```

## 🔍 Deployment Status Check

### List all deployed functions:
```bash
supabase functions list --project-ref qpojzblbodlphwzfpxbi
```

### Check function logs:
```bash
supabase functions logs briq-sms --project-ref qpojzblbodlphwzfpxbi
```

## 🚨 Important Notes

1. **briq-sms is the priority** - This contains the consolidated OTP system
2. **otp-auth function was removed** - Don't try to deploy it
3. **Environment variables must be set** before deployment
4. **Test each function** after deployment to ensure they work
5. **Check logs** if any function fails

## 🔧 Troubleshooting

### If deployment fails:
1. Check you're in the correct directory: `cd smartcart-e-commerce-hub`
2. Verify project link: `supabase status`
3. Check function syntax: Look for TypeScript errors
4. Verify environment variables are set in Supabase dashboard

### If functions return HTML errors:
1. Check BRIQ_API_KEY is correctly set
2. Verify the API key is valid and active
3. Check function logs for detailed error messages

## 📱 After Deployment

1. **Test the web app** - Try logging in with OTP
2. **Use test files** - Open `test_consolidated_otp.html` in browser
3. **Check SMS delivery** - Verify messages reach +255683859574
4. **Monitor logs** - Watch for any runtime errors

## 🎯 Expected Results

After successful deployment:
- ✅ OTP SMS should be sent to real phone numbers
- ✅ No more "HTML error page" responses
- ✅ All payment webhooks should work
- ✅ Order notifications should be sent via SMS