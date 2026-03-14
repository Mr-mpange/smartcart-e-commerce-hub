# Snippe Integration Debugging Guide

## Problem
Payment links redirect to Snippe but return 404:
- URL: `https://snippe.me/p/SN17734329566923558`
- Error: HTTP 404 Not Found

## Root Cause
The SNIPPE_API_KEY is either:
1. Not set in Supabase
2. Invalid or expired
3. Doesn't have correct permissions

## How to Debug Locally

### Step 1: Get Your SNIPPE_API_KEY

1. Go to [Snippe Dashboard](https://dashboard.snippe.sh)
2. Login with your account
3. Go to **Settings** → **API Keys**
4. Copy your API key (starts with `sk_` or similar)

### Step 2: Test Locally (Windows PowerShell)

```powershell
# Set the API key
$env:SNIPPE_API_KEY = "your-api-key-here"

# Run the test
.\test-snippe.ps1
```

### Step 3: Test Locally (Mac/Linux Bash)

```bash
# Set the API key
export SNIPPE_API_KEY="your-api-key-here"

# Run the test
bash test-snippe.sh
```

### Step 4: Test Locally (Node.js)

```bash
# Set the API key
export SNIPPE_API_KEY="your-api-key-here"

# Run the test
node test-snippe-integration.js
```

## What the Test Does

1. **Checks API Key** - Verifies SNIPPE_API_KEY is set
2. **Creates Test Payment** - Calls Snippe API to create a payment
3. **Checks Response** - Verifies Snippe returns a reference
4. **Tests Link** - Tries to access the payment link on Snippe

## Expected Output

### Success
```
✅ SNIPPE_API_KEY is set
   Key length: 32 characters

[TEST 1] Creating test payment on Snippe...
✅ Payment created successfully!
   Reference: SN17734329566923558
   Checkout URL: https://snippe.me/p/SN17734329566923558

[TEST 2] Testing if payment link is accessible...
✅ Payment link is accessible (HTTP 200)
```

### Failure - Invalid API Key
```
❌ Snippе API Error:
   Error: Unauthorized
   Message: Invalid API key
```

### Failure - Wrong Payload
```
❌ Snippе API Error:
   Error: Invalid request
   Message: Missing required field: phone_number
```

## If Test Fails

### 1. Check API Key
- Is it correct?
- Is it not expired?
- Does it have correct permissions?

### 2. Check Payload
- All required fields present?
- Correct data types?
- Valid phone number format?

### 3. Check Snippe Status
- Is Snippe API working?
- Any maintenance?
- Check [Snippe Status Page](https://status.snippe.sh)

### 4. Contact Snippe Support
- Email: support@snippe.sh
- Provide:
  - API key (masked)
  - Error response
  - Test payload

## Next Steps After Testing

### If Test Passes
1. Update SNIPPE_API_KEY in Supabase
2. Redeploy edge functions
3. Test payment link creation
4. Verify Snippe checkout works

### If Test Fails
1. Fix the issue (API key, payload, etc.)
2. Run test again
3. Once test passes, update Supabase
4. Redeploy and test

## Update SNIPPE_API_KEY in Supabase

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** → **Edge Functions** → **Secrets**
4. Update `SNIPPE_API_KEY` with the correct key
5. Redeploy edge functions:
   ```bash
   npx supabase functions deploy create-payment-link
   npx supabase functions deploy snippe-webhook
   ```

## Test Files

- `test-snippe.ps1` - PowerShell test (Windows)
- `test-snippe.sh` - Bash test (Mac/Linux)
- `test-snippe-integration.js` - Node.js test (any OS)

## Quick Test Command

### Windows PowerShell
```powershell
$env:SNIPPE_API_KEY = "your-key"; .\test-snippe.ps1
```

### Mac/Linux
```bash
export SNIPPE_API_KEY="your-key" && bash test-snippe.sh
```

---

**Status**: Ready to test
**Next Action**: Get SNIPPE_API_KEY and run test
