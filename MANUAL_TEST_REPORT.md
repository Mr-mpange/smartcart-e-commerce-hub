# Manual Test Report - Payment Link System

**Tester:** You  
**Email:** kilindosaid771@gmail.com  
**Date:** March 14, 2026  
**Dev Server:** http://localhost:5173/

---

## Test Execution Steps

### Step 1: Open Application
1. Open browser
2. Navigate to: `http://localhost:5173/`
3. Verify page loads
4. **Result:** ✅ / ❌

### Step 2: Login
1. Click on Auth or Login button
2. Enter email: `kilindosaid771@gmail.com`
3. Enter password: [your password]
4. Click "Sign In" or "Login"
5. Verify you're logged in
6. **Result:** ✅ / ❌

### Step 3: Navigate to Payment Monitoring
1. Look for "Payment Monitoring" or "Payment Collection" section
2. Click on it
3. Verify page loads
4. Verify "Create Payment Link" button visible
5. **Result:** ✅ / ❌

### Step 4: Create Payment Link
1. Click "Create Payment Link" button
2. A dialog/form should appear
3. Fill in the form:
   - **Amount:** 1000
   - **Recipient Name:** Test User
   - **Recipient Phone:** 255754000000
   - **Description:** Test Payment Link
4. Click "Generate Payment Link" button
5. **Result:** ✅ / ❌

### Step 5: Check Toast Notifications
**You should see TWO notifications:**

**Notification 1 (appears first, 10 seconds):**
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/[slug]
```

**Notification 2 (appears second, 5 seconds):**
```
ℹ️ Shareable link copied to clipboard!
```

**Record the shareable link URL:**
```
https://uzanasi.online/pay/________________
```

**Result:** ✅ / ❌

### Step 6: Check Payment Monitoring Table
1. Look at the table below the "Create Payment Link" button
2. You should see a new row with your payment link
3. **Verify the following:**
   - Reference: `SN...` (Snippe reference)
   - Amount: `TSh 1,000`
   - Status: `Active`
   - In the Actions column, you should see:
     ```
     Shareable Link:
     https://uzanasi.online/pay/[slug]
     
     [Copy Shareable Link] [Open Link] [Copy Snippe Link] [Delete]
     ```

**Result:** ✅ / ❌

### Step 7: Test Copy Shareable Link Button
1. In the table, click "Copy Shareable Link" button
2. Open Notepad or any text editor
3. Paste (Ctrl+V)
4. **Verify the URL format:**
   ```
   https://uzanasi.online/pay/[8-character-slug]
   ```
   Example: `https://uzanasi.online/pay/h0j5nd5b`

**Result:** ✅ / ❌

### Step 8: Test Open Link Button
1. In the table, click "Open Link" button
2. A new tab should open
3. **Verify the URL in the new tab:**
   ```
   http://localhost:5173/pay/[slug]
   ```
4. **Verify the payment page shows:**
   - Payment amount: `TSh 1,000`
   - Share link section (with blue border)
   - QR code (visible)
   - "Proceed to Payment" button
   - Share buttons (SMS, WhatsApp)

**Result:** ✅ / ❌

### Step 9: Test SMS Copy Button (on Payment Page)
1. On the payment page, click "📱 Copy for SMS" button
2. You should see a toast: `Copied to clipboard!`
3. Open Notepad
4. Paste (Ctrl+V)
5. **Verify the message:**
   ```
   Pay here: https://uzanasi.online/pay/[slug]
   ```

**Result:** ✅ / ❌

### Step 10: Test WhatsApp Share Button (on Payment Page)
1. On the payment page, click "💬 Share on WhatsApp" button
2. WhatsApp should open (or WhatsApp Web if not installed)
3. **Verify the message contains:**
   ```
   Pay here: https://uzanasi.online/pay/[slug]
   ```

**Result:** ✅ / ❌

### Step 11: Test QR Code
1. On the payment page, you should see a QR code
2. Open your phone camera or QR scanner app
3. Point at the QR code on screen
4. **Verify it opens:**
   ```
   https://uzanasi.online/pay/[slug]
   ```

**Result:** ✅ / ❌

### Step 12: Test Download QR Code
1. On the payment page, click "Download QR Code" button
2. A file should download
3. **Verify filename:**
   ```
   payment-[slug].png
   ```
   Example: `payment-h0j5nd5b.png`
4. Open the downloaded image
5. Verify it shows a QR code

**Result:** ✅ / ❌

### Step 13: Test Proceed to Payment Button
1. On the payment page, click "Proceed to Payment" button
2. You should be redirected to Snippe checkout
3. **Verify the URL:**
   ```
   https://snippe.me/p/SN[reference]
   ```
4. Verify Snippe payment page loads

**Result:** ✅ / ❌

### Step 14: Browser Console Check
1. Open DevTools (F12)
2. Go to Console tab
3. **Verify:**
   - No red error messages
   - No failed network requests
   - Should see logs like:
     ```
     Payment link created: https://uzanasi.online/pay/[slug]
     Shareable URL: https://uzanasi.online/pay/[slug]
     ```

**Result:** ✅ / ❌

---

## Test Results Summary

### Overall Status
- [ ] ✅ ALL TESTS PASSED
- [ ] ⚠️ SOME TESTS FAILED
- [ ] ❌ CRITICAL ISSUES FOUND

### Test Results

| Step | Test | Result | Notes |
|------|------|--------|-------|
| 1 | Application loads | ✅/❌ | |
| 2 | Login works | ✅/❌ | |
| 3 | Payment Monitoring accessible | ✅/❌ | |
| 4 | Create Payment Link | ✅/❌ | |
| 5 | Toast notifications | ✅/❌ | |
| 6 | Table display | ✅/❌ | |
| 7 | Copy Shareable Link | ✅/❌ | |
| 8 | Open Link | ✅/❌ | |
| 9 | SMS Copy | ✅/❌ | |
| 10 | WhatsApp Share | ✅/❌ | |
| 11 | QR Code Scan | ✅/❌ | |
| 12 | Download QR | ✅/❌ | |
| 13 | Proceed to Payment | ✅/❌ | |
| 14 | Console Check | ✅/❌ | |

---

## Issues Found

### Issue 1
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________  
**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low

### Issue 2
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________  
**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low

### Issue 3
**Description:** _______________  
**Steps to Reproduce:** _______________  
**Expected:** _______________  
**Actual:** _______________  
**Severity:** 🔴 Critical / 🟡 Medium / 🟢 Low

---

## Shareable Link Created

**Email:** kilindosaid771@gmail.com  
**Amount:** TSh 1,000  
**Shareable Link:** https://uzanasi.online/pay/________________  
**Snippe Reference:** SN________________  
**Created:** [Date/Time]

---

## Notes

_______________
_______________
_______________

---

## Sign-Off

**Tester:** _______________  
**Date:** _______________  
**Time:** _______________  
**Status:** ✅ PASS / ⚠️ PARTIAL / ❌ FAIL

---

## Next Steps

- [ ] All tests passed → Ready for production
- [ ] Some tests failed → Fix issues and re-test
- [ ] Critical issues → Stop and report

---

**Instructions:**
1. Follow each step above
2. Mark ✅ or ❌ for each result
3. Record any issues found
4. Note the shareable link created
5. Report back with results
