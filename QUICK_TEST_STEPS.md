# Quick Test Steps - 5 Minutes

**Email:** kilindosaid771@gmail.com  
**Dev Server:** http://localhost:5173/

---

## 1. Login (1 min)
```
1. Go to http://localhost:5173/
2. Click Auth/Login
3. Email: kilindosaid771@gmail.com
4. Password: [your password]
5. Click Sign In
```

## 2. Go to Payment Monitoring (30 sec)
```
1. Find "Payment Monitoring" section
2. Click on it
```

## 3. Create Payment Link (1 min)
```
1. Click "Create Payment Link"
2. Amount: 1000
3. Name: Test User
4. Phone: 255754000000
5. Description: Test
6. Click "Generate Payment Link"
```

## 4. Check Results (2 min)
```
✅ See toast: "Payment link created! Shareable: https://uzanasi.online/pay/..."
✅ See toast: "Shareable link copied to clipboard!"
✅ See in table: Shareable link with copy button
✅ Copy button works
✅ Open link works
✅ Payment page loads
```

---

## Expected Shareable Link Format

```
https://uzanasi.online/pay/h0j5nd5b
```

(8-character slug after /pay/)

---

## What Should Happen

1. **Toast 1:** Shows shareable link
2. **Toast 2:** Shows "copied to clipboard"
3. **Table:** Shows shareable link with buttons
4. **Copy Button:** Copies the shareable link
5. **Open Button:** Opens payment page
6. **Payment Page:** Shows payment details and QR code

---

## If Something Doesn't Work

**Check:**
1. Browser console (F12) for errors
2. Network tab for failed requests
3. Verify you're logged in
4. Verify email is correct

---

## Report Back With

1. ✅ or ❌ for each step
2. The shareable link created
3. Any errors seen
4. Screenshots if possible

---

**Ready? Start testing!** 🚀
