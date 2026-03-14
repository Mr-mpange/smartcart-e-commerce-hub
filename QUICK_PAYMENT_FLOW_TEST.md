# Quick Payment Flow Test
**Date:** March 14, 2026  
**Status:** Ready to Execute  
**All Edge Functions:** ✅ Deployed

---

## Quick Test Steps

### Step 1: Create a Test Payment Link

**Command:**
```bash
curl -X POST https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/create-payment-link \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Test Payment Link",
    "recipient_phone": "255754000000",
    "recipient_name": "Test User"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "slug": "abc12345",
  "payment_link_url": "https://uzanasi.online/pay/abc12345",
  "checkout_url": "https://snippe.me/p/SN_REFERENCE"
}
```

**Save the slug:** `abc12345`

---

### Step 2: Open Payment Link in Browser

**URL:**
```
http://localhost:5173/pay/abc12345
```

**Expected Result:**
- ✅ Page loads without errors
- ✅ Payment amount displays: "TSh 10,000"
- ✅ Share link section visible with border-2
- ✅ QR code visible
- ✅ SMS and WhatsApp buttons visible

---

### Step 3: Test Share Link Features

**Test Copy Button:**
1. Click "Copy" button
2. Verify button text changes to "Copied!"
3. Paste (Ctrl+V) to verify URL in clipboard

**Test SMS Copy:**
1. Click "📱 Copy for SMS"
2. Verify toast notification appears
3. Paste to verify: `Pay here: https://uzanasi.online/pay/abc12345`

**Test WhatsApp:**
1. Click "💬 Share on WhatsApp"
2. Verify WhatsApp opens with message

**Test QR Code:**
1. Scan QR code with phone camera
2. Verify it opens: `https://uzanasi.online/pay/abc12345`

**Test Download QR:**
1. Click "Download QR Code"
2. Verify file downloads: `payment-abc12345.png`

---

### Step 4: Test Payment Initiation

**Click "Proceed to Payment"**
- Expected: Redirects to Snippe checkout
- URL: `https://snippe.me/p/SN_REFERENCE`

---

### Step 5: Test Order Checkout Flow

**Create Test Order:**
```bash
curl -X POST https://qpojzblbodlphwzfpxbi.supabase.co/rest/v1/orders \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-id",
    "total_amount": 50000,
    "delivery_address": "Test Address",
    "phone_number": "255754000000",
    "payment_method": "mobile_money",
    "status": "pending"
  }'
```

**Save the order_id:** `order-123`

---

### Step 6: Initiate Payment

**Command:**
```bash
curl -X POST https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/snippe-payment \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_id": "order-123",
    "buyer_name": "Test User",
    "buyer_email": "test@example.com",
    "buyer_phone": "255754000000",
    "amount": 50000
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "reference": "SN_REFERENCE",
  "status": "pending"
}
```

---

### Step 7: Verify PaymentSuccess Page

**URL:**
```
http://localhost:5173/payment-success?order_id=order-123&method=mobile_money
```

**Expected Result:**
- ✅ Page loads
- ✅ Shows "Confirm Payment on Your Phone"
- ✅ Shows step-by-step instructions
- ✅ Status badge shows "Awaiting Payment"
- ✅ Real-time updates enabled

---

### Step 8: Simulate Payment Completion

**Command:**
```bash
curl -X POST https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/snippe-webhook \
  -H "Content-Type: application/json" \
  -d '{
    "type": "payment.completed",
    "data": {
      "reference": "SN_REFERENCE",
      "status": "completed",
      "metadata": {
        "order_id": "order-123"
      }
    }
  }'
```

**Expected Response:**
```json
{
  "received": true,
  "processed": true
}
```

---

### Step 9: Verify Order Status Updated

**Command:**
```bash
curl -X GET "https://qpojzblbodlphwzfpxbi.supabase.co/rest/v1/orders?id=eq.order-123" \
  -H "apikey: YOUR_ANON_KEY"
```

**Expected Response:**
```json
[
  {
    "id": "order-123",
    "status": "confirmed",
    "total_amount": 50000,
    ...
  }
]
```

---

### Step 10: Verify Real-Time Update

**In Browser:**
1. Keep PaymentSuccess page open
2. Run webhook simulation (Step 8)
3. Verify page auto-updates:
   - Status badge changes to "Payment Confirmed"
   - Toast notification appears
   - Escrow info displayed

---

## Test Results Template

```
Date: _______________
Tester: _______________

Test Results:
[ ] Step 1: Create Payment Link - PASS / FAIL
[ ] Step 2: Open Payment Link - PASS / FAIL
[ ] Step 3: Share Link Features - PASS / FAIL
[ ] Step 4: Payment Initiation - PASS / FAIL
[ ] Step 5: Create Test Order - PASS / FAIL
[ ] Step 6: Initiate Payment - PASS / FAIL
[ ] Step 7: PaymentSuccess Page - PASS / FAIL
[ ] Step 8: Simulate Webhook - PASS / FAIL
[ ] Step 9: Verify Order Status - PASS / FAIL
[ ] Step 10: Real-Time Update - PASS / FAIL

Overall Status: ✅ PASS / ❌ FAIL

Issues Found:
1. _______________
2. _______________

Notes:
_______________
```

---

## Browser Console Checks

**Open DevTools (F12) and verify:**

1. **No Errors:**
   - ✅ No red error messages
   - ✅ No failed network requests

2. **Network Tab:**
   - ✅ Payment link fetch succeeds (200)
   - ✅ Edge function calls succeed (200)
   - ✅ All assets load

3. **Console Tab:**
   - ✅ No TypeScript errors
   - ✅ No React warnings
   - ✅ Fetch logs show successful queries

---

## Common Issues & Solutions

### Issue: Payment Link Not Found
**Solution:**
- Verify slug exists in database
- Check database connection
- Verify RLS policies allow public access

### Issue: Edge Function Returns 404
**Solution:**
- Verify function name in URL
- Check function is deployed: `npx supabase functions list`
- Verify JWT verification setting

### Issue: Webhook Not Received
**Solution:**
- Check edge function logs: `npx supabase functions logs snippe-webhook`
- Verify webhook URL is correct
- Check network connectivity

### Issue: Real-Time Updates Not Working
**Solution:**
- Check WebSocket connection in DevTools
- Verify Supabase real-time enabled
- Check RLS policies allow updates

---

## Success Criteria

✅ **All tests pass when:**
1. Payment link created with slug
2. Payment link page loads and displays correctly
3. Share link features work (copy, SMS, WhatsApp, QR)
4. Payment initiated successfully
5. PaymentSuccess page shows correct status
6. Webhook received and processed
7. Order status updated to "confirmed"
8. Real-time updates work on PaymentSuccess page
9. No console errors
10. All network requests succeed

---

## Next Steps After Testing

1. **If all tests pass:**
   - ✅ Payment system is working
   - ✅ Ready for production deployment
   - ✅ Configure webhooks in payment provider dashboards

2. **If tests fail:**
   - Check edge function logs
   - Verify environment variables
   - Check database schema
   - Review error messages

---

**Status:** Ready to execute tests  
**All Edge Functions:** ✅ Deployed and Active  
**Payment System:** ✅ Ready for Testing
