# Fix: Payment Link Shareable URL Issue

## Problem
Payment link created with Snippe reference (SN17734693211441088) but shareable URL not shown.

The shareable URL should be: `https://uzanasi.online/pay/{slug}`

## Root Cause
The payment link was created but the slug might not be visible in the UI, or the response didn't include it.

## Solution

### Step 1: Find the Slug for Your Payment Link

**Query the database:**
```sql
SELECT 
  id,
  slug,
  snippe_reference,
  amount,
  status,
  created_at
FROM payment_links
WHERE snippe_reference = 'SN17734693211441088'
LIMIT 1;
```

**Expected Result:**
```
id: [UUID]
slug: abc12345
snippe_reference: SN17734693211441088
amount: 1000
status: active
created_at: 2026-03-14 09:22:00
```

### Step 2: Construct Your Shareable URL

Once you have the slug, your shareable URL is:
```
https://uzanasi.online/pay/{slug}
```

**Example:**
```
https://uzanasi.online/pay/abc12345
```

### Step 3: Test the Shareable Link

1. Open the URL in your browser
2. Verify payment details display correctly
3. Test share features (SMS, WhatsApp, QR code)
4. Click "Proceed to Payment" to test checkout

---

## How to Get the Slug

### Option 1: Check Supabase Dashboard
1. Go to Supabase Dashboard
2. Navigate to SQL Editor
3. Run the query above
4. Find your payment link by snippe_reference

### Option 2: Use REST API
```bash
curl -X GET "https://qpojzblbodlphwzfpxbi.supabase.co/rest/v1/payment_links?snippe_reference=eq.SN17734693211441088&select=slug" \
  -H "apikey: YOUR_ANON_KEY"
```

### Option 3: Check Edge Function Response
When creating a payment link, the response should include:
```json
{
  "success": true,
  "slug": "abc12345",
  "payment_link_url": "https://uzanasi.online/pay/abc12345",
  "checkout_url": "https://snippe.me/p/SN17734693211441088"
}
```

---

## Why Two Links?

**Two different links serve different purposes:**

1. **Shareable Link (OUR link):**
   - URL: `https://uzanasi.online/pay/{slug}`
   - Purpose: Share with customers
   - What it does: Shows payment details, QR code, share buttons
   - Where it goes: Stays on our platform

2. **Checkout Link (SNIPPE link):**
   - URL: `https://snippe.me/p/{reference}`
   - Purpose: Where customer actually pays
   - What it does: Processes payment via Snippe
   - Where it goes: Redirects to Snippe payment gateway

**Flow:**
```
Customer receives: https://uzanasi.online/pay/abc12345
↓
Opens link → Sees payment details & QR code
↓
Clicks "Proceed to Payment"
↓
Redirects to: https://snippe.me/p/SN17734693211441088
↓
Completes payment on Snippe
↓
Webhook confirms payment
↓
Back to our system
```

---

## Your Payment Link

**Snippe Reference:** SN17734693211441088  
**Amount:** TSh 1,000  
**Status:** Active  
**Created:** Mar 14, 09:22 AM

**To find your shareable URL:**

1. Go to Supabase Dashboard
2. SQL Editor
3. Run:
```sql
SELECT slug FROM payment_links 
WHERE snippe_reference = 'SN17734693211441088';
```

4. Your shareable URL will be:
```
https://uzanasi.online/pay/{slug-from-query}
```

---

## Testing Your Shareable Link

Once you have the slug:

1. **Open in Browser:**
   ```
   http://localhost:5173/pay/{slug}
   ```

2. **Verify Display:**
   - ✅ Payment amount shows: TSh 1,000
   - ✅ Share link section visible
   - ✅ QR code visible
   - ✅ SMS/WhatsApp buttons visible

3. **Test Features:**
   - ✅ Copy link button works
   - ✅ SMS copy works
   - ✅ WhatsApp share works
   - ✅ QR code scans correctly
   - ✅ Download QR works

4. **Test Payment:**
   - ✅ Click "Proceed to Payment"
   - ✅ Redirects to Snippe checkout
   - ✅ Payment completes
   - ✅ Status updates

---

## Summary

**The issue:** Shareable URL not visible in the UI  
**The solution:** Query database to find slug, then construct URL  
**Your shareable URL format:** `https://uzanasi.online/pay/{slug}`

**Next steps:**
1. Find your slug in the database
2. Test the shareable URL
3. Share with customers
4. Monitor analytics (views, payments, collected)

---

**Status:** Ready to retrieve and test your shareable link
