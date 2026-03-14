# Payment Link Manual Testing Guide
**Quick Reference for Testing the Updated PaymentPage**

---

## Quick Start

### Prerequisites
- Development server running (`npm run dev`)
- Supabase project configured
- Edge function deployed
- Valid payment link created

---

## Testing Workflow

### Step 1: Create a Test Payment Link

**Option A: Using Edge Function (Recommended)**

```bash
# Use the test script or API call
curl -X POST https://your-project.supabase.co/functions/v1/create-payment-link \
  -H "Authorization: Bearer YOUR_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 10000,
    "description": "Test Payment Link",
    "recipient_name": "Test User",
    "recipient_phone": "255754000000"
  }'
```

**Response will include:**
```json
{
  "success": true,
  "slug": "liux7m96",
  "payment_link_url": "https://uzanasi.online/pay/liux7m96",
  "checkout_url": "https://snippe.me/p/SN17734681375356016"
}
```

**Option B: Using Database Directly**

```sql
INSERT INTO payment_links (
  slug, amount, description, status, 
  snippe_reference, recipient_name, recipient_phone,
  views, payments_count, total_collected
) VALUES (
  'test1234', 10000, 'Test Payment', 'active',
  'SN_TEST_' || to_char(now(), 'YYYYMMDDHHmmss'),
  'Test User', '255754000000',
  0, 0, 0
);
```

---

### Step 2: Open the Payment Link

**In Browser:**
```
http://localhost:5173/pay/liux7m96
```

**Expected Result:**
- ✅ Page loads without errors
- ✅ No console errors
- ✅ All sections visible

---

### Step 3: Test Share Link Section

**Visual Verification:**
1. Look for the section with border-2 and primary color
2. Verify heading: "📤 Share This Payment Link"
3. Verify description text is visible
4. Verify input field shows: `https://uzanasi.online/pay/liux7m96`

**Test Copy Button:**
1. Click the "Copy" button
2. Verify button text changes to "Copied!"
3. Wait 2 seconds
4. Verify button text reverts to "Copy"
5. Paste (Ctrl+V) to verify URL is in clipboard

**Test SMS Copy Button:**
1. Click "📱 Copy for SMS"
2. Verify toast notification appears: "Copied to clipboard!"
3. Paste to verify content: `Pay here: https://uzanasi.online/pay/liux7m96`

**Test WhatsApp Button:**
1. Click "💬 Share on WhatsApp"
2. Verify WhatsApp opens (or WhatsApp Web)
3. Verify message contains: `Pay here: https://uzanasi.online/pay/liux7m96`

---

### Step 4: Test QR Code

**Visual Verification:**
1. Scroll to "Scan to Pay" section
2. Verify QR code is visible
3. Verify QR code is centered
4. Verify white background

**Test QR Code Scanning:**
1. Open phone camera or QR scanner app
2. Point at QR code on screen
3. Verify it opens: `https://uzanasi.online/pay/liux7m96`

**Test Download:**
1. Click "Download QR Code" button
2. Verify file downloads
3. Verify filename: `payment-liux7m96.png`
4. Open downloaded image
5. Verify QR code is visible

---

### Step 5: Test Payment Amount Display

**Verification:**
1. Look for large text showing amount
2. Verify format: `TSh 10,000`
3. Verify description is shown below amount
4. Verify styling is prominent

---

### Step 6: Test Analytics

**Verification:**
1. Scroll to bottom of page
2. Verify three metrics visible:
   - Views: Should be 1 (incremented on page load)
   - Payments: Should be 0
   - Collected: Should be 0 TSh

**Test View Tracking:**
1. Refresh page
2. Verify Views count increments to 2
3. Refresh again
4. Verify Views count increments to 3

---

### Step 7: Test Payment Flow

**Proceed to Payment:**
1. Click "Proceed to Payment" button
2. Verify redirects to Snippe checkout
3. Verify URL is: `https://snippe.me/p/SN17734681375356016`

**Complete Payment (Optional):**
1. Follow Snippe payment flow
2. Complete payment or cancel
3. Return to payment link page
4. Verify status updates to "Paid" (if payment completed)

---

### Step 8: Test Backward Compatibility

**Test Old Payment Links (without slug):**
1. Create a payment link with NULL slug in database
2. Try to access by ID: `http://localhost:5173/pay/{id}`
3. Verify page loads (fallback to ID fetch)
4. Verify all features work

---

### Step 9: Test Error Handling

**Test Invalid Link:**
1. Navigate to: `http://localhost:5173/pay/invalid123`
2. Verify error message: "Payment Link Not Found"
3. Verify "Go Home" and "Go Back" buttons work

**Test Expired Link:**
1. Create payment link with past expiration date
2. Navigate to link
3. Verify "Expired" badge appears
4. Verify payment button is disabled

**Test Paid Link:**
1. Create payment link and mark as paid
2. Navigate to link
3. Verify "✓ Paid" badge appears
4. Verify success message displays

---

## Browser Console Checks

**Open Developer Tools (F12) and verify:**

1. **No Errors:**
   - ✅ No red error messages
   - ✅ No failed network requests

2. **Network Tab:**
   - ✅ Payment link fetch succeeds (200 status)
   - ✅ QR code generation completes
   - ✅ All assets load

3. **Console Tab:**
   - ✅ No TypeScript errors
   - ✅ No React warnings
   - ✅ Fetch logs show successful queries

---

## Mobile Testing

**On iOS:**
1. Open Safari
2. Navigate to payment link
3. Test all buttons
4. Test QR code scanning with camera
5. Test WhatsApp share

**On Android:**
1. Open Chrome
2. Navigate to payment link
3. Test all buttons
4. Test QR code scanning with camera
5. Test WhatsApp share

---

## Performance Checks

**Measure Load Time:**
1. Open DevTools Network tab
2. Refresh page
3. Check "Finish" time
4. Should be < 2 seconds

**Check QR Generation:**
1. Open DevTools Performance tab
2. Record while page loads
3. QR generation should be < 500ms

---

## Responsive Design Check

**Desktop (1920x1080):**
- ✅ All sections visible
- ✅ Share link section prominent
- ✅ QR code centered

**Tablet (768x1024):**
- ✅ Layout adapts
- ✅ Buttons accessible
- ✅ Text readable

**Mobile (375x667):**
- ✅ Single column layout
- ✅ Buttons full width
- ✅ Text readable
- ✅ QR code visible

---

## Accessibility Checks

**Keyboard Navigation:**
1. Press Tab to navigate
2. Verify all buttons are reachable
3. Verify focus indicators visible
4. Verify Enter activates buttons

**Screen Reader (NVDA/JAWS):**
1. Enable screen reader
2. Navigate page
3. Verify all text is read
4. Verify buttons are announced

---

## Test Results Template

```
Date: _______________
Tester: _______________
Browser: _______________
Device: _______________

Test Results:
[ ] Share Link Section - PASS / FAIL
[ ] Copy Button - PASS / FAIL
[ ] SMS Copy Button - PASS / FAIL
[ ] WhatsApp Share - PASS / FAIL
[ ] QR Code Display - PASS / FAIL
[ ] QR Code Download - PASS / FAIL
[ ] Payment Amount - PASS / FAIL
[ ] Analytics Display - PASS / FAIL
[ ] Payment Flow - PASS / FAIL
[ ] Error Handling - PASS / FAIL
[ ] Mobile Responsive - PASS / FAIL
[ ] Accessibility - PASS / FAIL

Issues Found:
1. _______________
2. _______________
3. _______________

Notes:
_______________
_______________
```

---

## Common Issues & Solutions

### Issue: QR Code Not Visible
**Solution:**
- Check browser console for errors
- Verify `qrcode.react` is installed
- Clear browser cache and reload

### Issue: Copy Button Not Working
**Solution:**
- Check browser permissions for clipboard
- Verify `navigator.clipboard` is available
- Try in different browser

### Issue: WhatsApp Not Opening
**Solution:**
- Verify WhatsApp is installed
- Try WhatsApp Web instead
- Check URL encoding

### Issue: Toast Not Showing
**Solution:**
- Verify `sonner` is installed
- Check browser console for errors
- Verify Toaster component is in App.tsx

### Issue: Payment Link Not Found
**Solution:**
- Verify slug exists in database
- Check database connection
- Verify RLS policies allow public access

---

## Quick Checklist

Before marking as complete:

- [ ] All UI elements visible
- [ ] Copy buttons work
- [ ] QR code generates
- [ ] QR code scans correctly
- [ ] WhatsApp share works
- [ ] Toast notifications appear
- [ ] Analytics update correctly
- [ ] Payment flow completes
- [ ] No console errors
- [ ] Mobile responsive
- [ ] Keyboard accessible
- [ ] Performance acceptable

---

## Sign-Off

**Tested By:** _______________  
**Date:** _______________  
**Status:** ✅ PASS / ❌ FAIL  
**Ready for Production:** YES / NO

---

**Notes:**
- This guide is for manual testing
- Automated tests can be added later
- Report any issues found
- Update this guide with new findings
