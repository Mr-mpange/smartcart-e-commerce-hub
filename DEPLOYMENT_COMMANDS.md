# 🚀 Quick Deployment Commands

## 🔧 Individual Function Deployment

Copy and paste these commands one by one in your terminal:

### 1. Priority: Deploy briq-sms (OTP System)
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
supabase functions deploy tembo-payout --project-ref qpojzblbodlphwzfpxbi
```

### 3. Deploy Other Functions
```bash
supabase functions deploy auto-release-escrow --project-ref qpojzblbodlphwzfpxbi
```

### 4. Check Deployment Status
```bash
supabase functions list --project-ref qpojzblbodlphwzfpxbi
```

## 🧪 Test Commands

### Test briq-sms OTP Generation
```bash
curl -L -X POST 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms' \
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ5NzI2NzQsImV4cCI6MjA1MDU0ODY3NH0.example' \
  -H 'Content-Type: application/json' \
  --data '{"action": "generate_otp", "email": "admin@test.com"}'
```

### Test briq-sms Direct SMS
```bash
curl -L -X POST 'https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/briq-sms' \
  -H 'Authorization: Bearer [YOUR_ANON_KEY]' \
  -H 'Content-Type: application/json' \
  --data '{"phone_number": "+255683859574", "message": "Test SMS"}'
```

## 📋 Functions to Deploy (Total: 9)

✅ **briq-sms** - Consolidated SMS + OTP system (PRIORITY)
✅ **create-payment-link** - Payment link generation
✅ **snippe-payment** - Snippe payment processing
✅ **snippe-webhook** - Snippe webhook handler
✅ **zenopay-payment** - Zenopay payment processing
✅ **zenopay-webhook** - Zenopay webhook handler
✅ **tembo-webhook** - Tembo webhook handler
✅ **tembo-payout** - Tembo payout processing
✅ **auto-release-escrow** - Automatic escrow release

❌ **otp-auth** - REMOVED (consolidated into briq-sms)

## 🔑 Environment Variables Needed

Set these in Supabase Dashboard > Settings > Edge Functions:

```
BRIQ_API_KEY=your_briq_api_key
SUPABASE_URL=https://qpojzblbodlphwzfpxbi.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎯 Expected Results After Deployment

- ✅ OTP SMS sent to real phone numbers
- ✅ No more HTML error responses
- ✅ Payment webhooks working
- ✅ Order notifications via SMS
- ✅ All functions listed in Supabase dashboard