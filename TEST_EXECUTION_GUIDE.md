# Test Execution Guide - Payment Link System

**Status:** ✅ Dev Server Running  
**URL:** http://localhost:5173/  
**Time:** Ready to Test

---

## Quick Test Steps

### Step 1: Open Application
```
URL: http://localhost:5173/
```

### Step 2: Login
- Sign in with your test account
- Verify you're logged in

### Step 3: Go to Payment Monitoring
- Find Payment Monitoring section
- Click on it

### Step 4: Create Payment Link
1. Click "Create Payment Link" button
2. Enter:
   - Amount: 1000
   - Recipient Name: Test User
   - Recipient Phone: 255754000000
   - Description: Test Payment Link
3. Click "Generate Payment Link"

### Step 5: Check Toast Notifications
**You should see:**
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/...
ℹ️ Shareable link copied to clipboard!
```

### Step 6: Check Table
**In the table, you should see:**
```
Shareable Link:
https://uzanasi.online/pay/h0j5nd5b

[Copy Shareable Link] [Open Link] [Copy Snippe Link] [Delete]
```

### Step 7: Test Copy Button
1. Click "Copy Shareable Link"
2. Paste (Ctrl+V) in notepad
3. Verify: `https://uzanasi.online/pay/h0j5nd5b`

### Step 8: Test Open Link
1. Click "Open Link"
2. New tab opens
3. Verify URL: `http://localhost:5173/pay/h0j5nd5b`
4. Verify payment page loads
5. Verify payment details display
6. Verify QR code visible

### Step 9: Test Share Features
1. On payment page, click "Copy for SMS"
2. Verify toast appears
3. Click "Share on WhatsApp"
4. Verify WhatsApp opens

### Step 10: Test Payment Button
1. Click "Proceed to Payment"
2. Verify redirects to Snippe
3. Verify URL: `https://snippe.me/p/SN...`

---

## What Should Work

✅ **Shareable Link Created**
- Format: `https://uzanasi.online/pay/{slug}`
- Example: `https://uzanasi.online/pay/h0j5nd5b`

✅ **Toast Notifications**
- Shows shareable link
- Shows "copied to clipboard"

✅ **Table Display**
- Shows shareable link
- Shows copy button
- Shows open button

✅ **Payment Page**
- Loads with slug
- Shows payment details
- Shows QR code
- Shows share buttons

✅ **Share Features**
- SMS copy works
- WhatsApp share works
- QR code visible
- QR download works

✅ **Payment Flow**
- Proceed to Payment works
- Redirects to Snippe
- Snippe checkout loads

---

## Browser Console Check

**Open DevTools (F12):**
1. Go to Console tab
2. Look for errors (red messages)
3. Should see no errors
4. Should see fetch logs

**Expected Logs:**
```
Payment link created: https://uzanasi.online/pay/h0j5nd5b
Shareable URL: https://uzanasi.online/pay/h0j5nd5b
Snippe URL: https://snippe.me/p/SN...
```

---

## Success Criteria

✅ Payment link creates successfully  
✅ Shareable link displays in toast  
✅ Shareable link in clipboard  
✅ Shareable link in table  
✅ Copy button works  
✅ Open link works  
✅ Payment page loads  
✅ Share features work  
✅ Payment flow works  
✅ No console errors  

---

## If Something Doesn't Work

### Issue: Toast not showing
- Check browser console (F12)
- Look for errors
- Verify sonner is installed

### Issue: Shareable link not in table
- Refresh page
- Check database
- Verify slug was generated

### Issue: Payment page not loading
- Check URL format
- Verify slug in database
- Check browser console

### Issue: Share buttons not working
- Check browser console
- Verify WhatsApp installed
- Try different browser

### Issue: Proceed to Payment not working
- Check browser console
- Verify Snippe URL
- Check network tab

---

## Report Results

**When testing, note:**
1. What worked
2. What didn't work
3. Any errors in console
4. Any unexpected behavior

---

## Dev Server Info

**Running on:**
```
http://localhost:5173/
```

**Status:**
```
✅ Vite v5.4.19 ready
✅ Local: http://localhost:5173/
✅ Ready for testing
```

---

**Ready to Test!** 🚀

Follow the steps above and report any issues found.
