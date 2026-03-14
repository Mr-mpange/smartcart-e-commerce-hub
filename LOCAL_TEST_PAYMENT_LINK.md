# Local Testing - Payment Link System

**Status:** ✅ Dev Server Running  
**URL:** http://localhost:5173/  
**Date:** March 14, 2026

---

## Dev Server Status

✅ **Vite v5.4.19 ready**  
✅ **Local: http://localhost:5173/**  
✅ **Ready for testing**

---

## Test Plan

### Phase 1: Access Application
1. Open browser
2. Navigate to: `http://localhost:5173/`
3. Verify page loads
4. Verify no console errors

### Phase 2: Login/Authentication
1. Go to Auth page
2. Sign in with test account
3. Verify authentication works
4. Verify redirected to home page

### Phase 3: Navigate to Payment Monitoring
1. Go to Payment Monitoring section
2. Verify page loads
3. Verify "Create Payment Link" button visible
4. Verify existing payment links display (if any)

### Phase 4: Create Payment Link
1. Click "Create Payment Link" button
2. Fill form:
   - Amount: 1000
   - Recipient Name: Test User
   - Recipient Phone: 255754000000
   - Description: Test Payment Link
3. Click "Generate Payment Link"
4. Verify success

### Phase 5: Verify Toast Notifications
**Expected to see:**
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/...
ℹ️ Shareable link copied to clipboard!
```

### Phase 6: Verify Table Display
**Expected to see in table:**
```
Reference: SN...
Amount: TSh 1,000
Status: Active

Shareable Link:
https://uzanasi.online/pay/{slug}

[Copy Shareable Link] [Open Link] [Copy Snippe Link] [Delete]
```

### Phase 7: Test Copy Button
1. Click "Copy Shareable Link"
2. Paste (Ctrl+V) in notepad
3. Verify URL format: `https://uzanasi.online/pay/{8-char-slug}`

### Phase 8: Test Open Link
1. Click "Open Link"
2. Verify new tab opens
3. Verify URL: `http://localhost:5173/pay/{slug}`
4. Verify payment page loads
5. Verify payment details display
6. Verify QR code visible
7. Verify share section visible

### Phase 9: Test Share Features (on Payment Page)
1. Click "Copy for SMS"
2. Verify toast: "Copied to clipboard!"
3. Paste to verify: `Pay here: https://uzanasi.online/pay/...`

4. Click "Share on WhatsApp"
5. Verify WhatsApp opens (or WhatsApp Web)
6. Verify message contains shareable link

5. Scan QR code with phone
6. Verify it opens: `https://uzanasi.online/pay/...`

7. Click "Download QR Code"
8. Verify file downloads: `payment-{slug}.png`

### Phase 10: Test Payment Initiation
1. Click "Proceed to Payment"
2. Verify redirects to Snippe checkout
3. Verify URL: `https://snippe.me/p/SN...`

### Phase 11: Browser Console Check
1. Open DevTools (F12)
2. Go to Console tab
3. Verify no errors
4. Verify no warnings
5. Check for successful fetch logs

### Phase 12: Database Verification
1. Go to Supabase Dashboard
2. Check payment_links table
3. Verify new link exists
4. Verify slug is 8 characters
5. Verify checkout_url is Snippe link
6. Verify status is "active"

---

## Expected Results

### Toast Notifications
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/h0j5nd5b
ℹ️ Shareable link copied to clipboard!
```

### Shareable Link Format
```
https://uzanasi.online/pay/h0j5nd5b
```

### Payment Page URL
```
http://localhost:5173/pay/h0j5nd5b
```

### Snippe Checkout URL
```
https://snippe.me/p/SN17734705053648315
```

---

## Test Checklist

- [ ] Dev server running
- [ ] Application loads
- [ ] Authentication works
- [ ] Payment Monitoring page loads
- [ ] Create Payment Link button visible
- [ ] Form fills correctly
- [ ] Payment link creates successfully
- [ ] Toast notifications appear
- [ ] Shareable link in toast
- [ ] Shareable link in clipboard
- [ ] Shareable link in table
- [ ] Copy button works
- [ ] Open link works
- [ ] Payment page loads
- [ ] Payment details display
- [ ] QR code visible
- [ ] Share features work
- [ ] SMS copy works
- [ ] WhatsApp share works
- [ ] QR code scans
- [ ] QR download works
- [ ] Proceed to Payment works
- [ ] Redirects to Snippe
- [ ] No console errors
- [ ] Database entry created
- [ ] Slug is 8 characters
- [ ] Status is "active"

---

## Troubleshooting

### Issue: Dev server not starting
**Solution:** 
- Check if port 5173 is in use
- Kill process: `netstat -ano | findstr :5173`
- Restart: `npm run dev`

### Issue: Page not loading
**Solution:**
- Clear browser cache: `Ctrl+Shift+R`
- Check console for errors
- Verify environment variables in .env

### Issue: Payment link not creating
**Solution:**
- Check browser console for errors
- Verify authentication token
- Check Supabase connection
- Verify edge function is deployed

### Issue: Shareable link not showing
**Solution:**
- Check toast notifications
- Check browser console
- Verify edge function response
- Check clipboard content

### Issue: Payment page not loading
**Solution:**
- Verify slug in URL
- Check database for payment link
- Verify RLS policies
- Check browser console

---

## Test Results

**Date:** March 14, 2026  
**Tester:** [Your Name]  
**Status:** ⏳ Pending

### Results

- [ ] All tests passed
- [ ] Some tests failed
- [ ] Critical issues found

### Issues Found

1. _______________
2. _______________
3. _______________

### Notes

_______________
_______________

---

## Next Steps

1. Run through all test phases
2. Document any issues
3. Fix issues if found
4. Re-test
5. Deploy to production

---

**Status:** ✅ Ready for Testing
