# Snippe Integration Issues & Solutions

## Problem

Payment links redirect to Snippe but fail with 404:
- URL: `https://snippe.me/p/SN17734321967174154`
- Error: HTTP 404 Not Found

## Root Causes

### 1. **Invalid SNIPPE_API_KEY**
- The API key might not be valid or expired
- Snippe API might be rejecting requests
- Payment not being created on Snippe's side

### 2. **Wrong Phone Number Format**
- Using generic phone number `255754000000`
- Snippe might require valid phone number format
- Format should be: `+255XXXXXXXXX` or `255XXXXXXXXX`

### 3. **Incorrect Payload Structure**
- Snippe API might expect different field names
- Missing required fields
- Wrong payment_type value

### 4. **Reference Not Generated**
- Snippe not returning valid reference
- Reference format might be wrong
- Payment not actually created

## Solutions

### Solution 1: Verify SNIPPE_API_KEY

**Check in Supabase**:
1. Go to Supabase Dashboard
2. Project Settings → Edge Functions → Secrets
3. Verify `SNIPPE_API_KEY` is set
4. Check if key is valid and not expired

**Test the key**:
```bash
curl -X POST https://api.snippe.sh/v1/payments \
  -H "Authorization: Bearer YOUR_SNIPPE_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "payment_type": "mobile",
    "details": {"amount": 1000, "currency": "TZS"},
    "phone_number": "+255700000000",
    "customer": {"firstname": "Test", "lastname": "User", "email": "test@example.com"}
  }'
```

### Solution 2: Use Correct Phone Number Format

**Update create-payment-link function**:
```typescript
// Use proper phone number format
phone_number: '+255700000000', // International format
// OR
phone_number: '255700000000',  // Without +
```

### Solution 3: Check Snippe API Response

**Add logging to edge function**:
```typescript
console.log('Snippe response status:', snippeResponse.status);
const snippeData = await snippeResponse.json();
console.log('Snippe response:', JSON.stringify(snippeData, null, 2));

if (!snippeResponse.ok) {
  console.error('Snippe error:', snippeData);
  // Log the actual error from Snippe
}
```

### Solution 4: Verify Payment Creation

**Check Supabase logs**:
1. Go to Supabase Dashboard
2. Functions → Logs
3. Look for `create-payment-link` function
4. Check what Snippe is returning

**Look for**:
- HTTP status from Snippe (should be 200 or 201)
- Response data structure
- Reference field in response
- Error messages

## Debugging Steps

### Step 1: Check Edge Function Logs
1. Create a payment link
2. Go to Supabase Dashboard
3. Functions → Logs
4. Search for `create-payment-link`
5. Look for Snippe response

### Step 2: Check Database
```sql
SELECT id, amount, status, snippe_reference, created_at 
FROM payment_links 
ORDER BY created_at DESC 
LIMIT 5;
```

**Look for**:
- Is `snippe_reference` populated?
- Does it start with "SN"?
- Is it a valid format?

### Step 3: Test Snippe Reference
```bash
curl https://snippe.me/p/SN17734321967174154
```

**Expected**: HTTP 200 (payment page loads)
**Actual**: HTTP 404 (payment not found)

## Possible Fixes

### Fix 1: Update Phone Number Format
```typescript
// In create-payment-link/index.ts
phone_number: '+255700000000', // Use international format
```

### Fix 2: Add Error Handling
```typescript
if (!snippeResponse.ok) {
  const errorData = await snippeResponse.json();
  console.error('Snippe API error:', errorData);
  return new Response(JSON.stringify({
    error: 'Snippe API error',
    details: errorData,
    status: snippeResponse.status
  }), { status: 400, headers: corsHeaders });
}
```

### Fix 3: Verify Reference Format
```typescript
if (!snippeData.data?.reference) {
  console.error('No reference in Snippe response');
  console.error('Full response:', snippeData);
  throw new Error('Snippe did not return a reference');
}
```

### Fix 4: Use Snippe's Checkout URL Directly
Instead of using reference, use Snippe's checkout URL:
```typescript
const checkoutUrl = snippeData.data.checkout_url;
// OR
const checkoutUrl = `https://snippe.me/p/${snippeData.data.reference}`;
```

## Next Steps

1. **Check SNIPPE_API_KEY** - Verify it's valid
2. **Check Supabase Logs** - See what Snippe is returning
3. **Check Database** - Verify snippe_reference is being saved
4. **Test Snippe Reference** - Try accessing the URL directly
5. **Update Phone Number** - Use proper format
6. **Add Better Error Handling** - Log all Snippe responses

## Contact Snippe Support

If the above doesn't work:
1. Contact Snippe support
2. Provide:
   - API key (masked)
   - Sample payment request
   - Error response from Snippe
   - Expected vs actual behavior

## Alternative: Use Snippe's Hosted Checkout

Instead of creating custom links, use Snippe's hosted checkout:
```typescript
// Redirect directly to Snippe's payment page
window.location.href = `https://snippe.me/checkout?amount=1000&currency=TZS&reference=${linkId}`;
```

---

**Status**: Investigating Snippe integration issue
**Priority**: High - Payment system not working
**Action**: Check SNIPPE_API_KEY and Supabase logs
