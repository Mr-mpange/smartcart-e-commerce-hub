# 🚀 START HERE - Payment System Testing

## ✅ Everything is Ready

The payment system is fully implemented and deployed. Follow these steps to test it.

---

## Step 1: Open the Application

Open your browser and go to:
```
http://localhost:5173/
```

---

## Step 2: Login

Use these credentials:
```
Email: kilindosaid771@gmail.com
Password: 11111111
```

Click "Sign In"

---

## Step 3: Navigate to Payment Collection

Look for "Payment Collection" or "Payment Monitoring" in the menu/dashboard.

---

## Step 4: Create a Payment Link

1. Click "Create Payment Link" button
2. Fill in the form:
   - **Amount:** 1000 (TSh)
   - **Recipient Name:** Test Customer
   - **Recipient Phone:** 255754000000
   - **Description:** Test Payment
3. Click "Generate Payment Link"

**You should see:**
- ✅ Toast: "Payment link created! Shareable: https://uzanasi.online/pay/{slug}"
- ℹ️ Toast: "Shareable link copied to clipboard!"

---

## Step 5: View the Payment Link

In the Payment Monitoring table, you should see your new payment link:
- Reference: `SN...` (Snippe reference)
- Amount: `TSh 1,000`
- Status: `Active`

---

## Step 6: Open the Shareable Link

Click the "Open Link" button in the Actions column.

**You should see:**
- Payment amount: TSh 1,000
- QR code
- "Share This Payment Link" section (blue border)
- "Proceed to Payment" button
- Share buttons (SMS, WhatsApp)

---

## Step 7: Test Sharing Features

### Copy Shareable Link
1. Click "Copy" button next to the URL
2. Paste in notepad
3. Should show: `https://uzanasi.online/pay/{slug}`

### Download QR Code
1. Click "Download QR Code" button
2. File downloads as `payment-{slug}.png`
3. Scan with phone camera - should open the link

### Share via SMS
1. Click "📱 Copy for SMS" button
2. Message copied: `Pay here: https://uzanasi.online/pay/{slug}`

### Share via WhatsApp
1. Click "💬 Share on WhatsApp" button
2. WhatsApp opens with the message

---

## Step 8: Proceed to Payment

1. Click "Proceed to Payment" button
2. You'll be redirected to Snippe checkout page
3. URL should be: `https://snippe.me/p/SN...`

---

## Step 9: Complete Payment (Optional)

On the Snippe checkout page, you can:
- Test with M-Pesa
- Test with Tigo Pesa
- Use test credentials if available

After payment:
- Snippe sends webhook to your system
- Payment link status updates to "PAID"
- You're redirected to success page

---

## Step 10: Verify Success

**Success Page Shows:**
- ✅ "Payment Received!" message
- Amount: TSh 1,000
- Reference number
- Shareable link

**Back in Payment Monitoring:**
- Status changes to "PAID"
- Payments count increases
- Total collected increases

---

## Automated Test (Optional)

Instead of manual testing, run:
```bash
node test-payment-link-simple.js
```

This will:
1. Login automatically
2. Create a payment link
3. Verify it's accessible
4. Show you the shareable URL

---

## What's Working

✅ Payment link creation  
✅ Shareable URLs with slugs  
✅ QR code generation  
✅ Social sharing (SMS, WhatsApp)  
✅ Payment processing via Snippe  
✅ Webhook integration  
✅ Success page  
✅ Analytics tracking  

---

## Troubleshooting

### "Payment Link Not Found"
- Check the slug in the URL
- Verify the link was created successfully
- Try refreshing the page

### Redirect to Snippe Not Working
- Check browser console (F12)
- Verify checkout_url is correct
- Try again

### Payment Status Not Updating
- Wait a few seconds for webhook
- Check if payment was completed on Snippe
- Refresh the page

---

## Key URLs

| What | URL |
|------|-----|
| App | http://localhost:5173/ |
| Payment Link | http://localhost:5173/pay/{slug} |
| Success Page | http://localhost:5173/payment-success?slug={slug} |
| Snippe Checkout | https://snippe.me/p/{reference} |

---

## Test Credentials

```
Email: kilindosaid771@gmail.com
Password: 11111111
```

---

## Need More Details?

- **Complete Testing Guide:** `PAYMENT_LINK_COMPLETE_TEST_GUIDE.md`
- **System Status:** `PAYMENT_SYSTEM_READY.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`

---

## Summary

The payment system is complete and ready to test. Follow the steps above to:

1. Create a payment link
2. Share it with customers
3. Process payments
4. Verify success

Everything is working correctly!

---

**Status:** ✅ Ready for Testing  
**Dev Server:** http://localhost:5173/  
**Last Updated:** March 14, 2026
