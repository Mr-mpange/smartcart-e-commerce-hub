# Payment Setup Guide

## Issue Fixed: 401 Unauthorized Error

The 401 Unauthorized error when calling payment functions has been resolved by:

1. **Adding proper authentication to Edge Function calls**
2. **Updating Edge Functions to verify user authentication**
3. **Adding session validation before making payment requests**

## Required Environment Variables

You need to set these environment variables in your Supabase project:

### In Supabase Dashboard > Settings > Edge Functions:

1. **SNIPPE_API_KEY** - Your Snippe payment gateway API key
2. **SUPABASE_URL** - Your Supabase project URL (should be auto-set)
3. **SUPABASE_ANON_KEY** - Your Supabase anon key (should be auto-set)

### How to set environment variables:

1. Go to your Supabase Dashboard
2. Navigate to Settings > Edge Functions
3. Add the following environment variables:
   ```
   SNIPPE_API_KEY=your_snippe_api_key_here
   ```

## Files Updated:

### 1. Checkout.tsx
- Added session validation before payment calls
- Added Authorization header to function calls

### 2. PaymentMonitoring.tsx
- Added authentication check for create-payment-link calls
- Added Authorization header

### 3. PayoutManagement.tsx
- Added authentication check for all tembo-payout calls
- Added Authorization headers

### 4. snippe-payment/index.ts
- Added Supabase client initialization
- Added user authentication verification
- Improved error handling and logging

## Testing the Fix:

1. **Ensure you're logged in** before trying to make payments
2. **Set the SNIPPE_API_KEY** environment variable in Supabase
3. **Deploy the updated Edge Functions** (if using Supabase CLI):
   ```bash
   supabase functions deploy snippe-payment
   ```

## Common Issues:

1. **Still getting 401?** 
   - Check if user is properly authenticated
   - Verify SNIPPE_API_KEY is set in Supabase environment variables

2. **Function not found?**
   - Make sure Edge Functions are deployed
   - Check function names match exactly

3. **CORS errors?**
   - Edge Functions already include proper CORS headers
   - Make sure you're calling from the correct domain

## Next Steps:

1. Set the SNIPPE_API_KEY environment variable
2. Test the payment flow with a logged-in user
3. Monitor the Edge Function logs for any remaining issues

The payment system should now work properly with authenticated users!