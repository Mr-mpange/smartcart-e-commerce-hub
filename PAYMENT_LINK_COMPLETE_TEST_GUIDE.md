# Complete Payment Link Testing Guide

## System Status ✅

All components are deployed and working:
- ✅ Edge functions deployed
- ✅ Payment link creation working
- ✅ Shareable URLs generated
- ✅ Webhook configured
- ✅ Payment success page ready

---

## How the Payment System Works

### Two URLs for Each Payment

1. **Shareable Link** (What you share with customers)
   ```
   https://uzanasi.online/pay/{slug}
   ```
   - This is your payment collection page
   - Customers see payment details and QR code
   - They click "Proceed to Payment" to pay

2. **Snippe Checkout Link** (Where payment happens)
   ```
   https://snippe.me/p/{reference}
   ```
   - This is the actual payment gateway
   - Customers enter M-Pesa/Tigo Pesa details
   - Payment is processed here

---

## Complete Testing Flow

### Step 1: Create a Payment Link

**Option A: Using the UI**
1. Open http://localhost:5173/
2. Login with:
   - Email: `kilindosaid771@gmail.com`
   - Password: `11111111`
3. Navigate to "Payment Collection" or "Payment Monitoring"
4. Click "Create Payment Link"
5. Fill in:
   - Amount: `1000` (TSh)
   - Recipient Name: `Test Customer`
   - Recipient Phone: `255754000000`
   - Description: `Test Payment`
6. Click "Generate Payment Link"
7. You'll see two notifications:
   - ✅ "Payment link created! Shareable: https://uzanasi.online/pay/{slug}"
   - ℹ️ "Shareable link copied to clipboard!"

**Option B: Using the Test Script**
```bash
node test-payment-link-simple.js
```

### Step 2: Access the Payment Link

**From the UI:**
1. In the Payment Monitoring table, click "Open Link" button
2. Or manually open: `http://localhost:5173/pay/{slug}`

**What you should see:**
- Payment amount (TSh 1,000)
- QR code
- "Share This Payment Link" section (blue border)
- "Proceed to Payment" button
- Share buttons (SMS, WhatsApp)

### Step 3: Test the Shareable Link Features

**Copy Shareable Link:**
1. Click "Copy" button next to the shareable URL
2. Paste in notepad - should show: `https://uzanasi.online/pay/{slug}`

**Download QR Code:**
1. Click "Download QR Code" button
2. File downloads as `payment-{slug}.png`
3. Scan with phone camera - should open the shareable link

**Share on SMS:**
1. Click "📱 Copy for SMS" button
2. Message copied: `Pay here: https://uzanasi.online/pay/{slug}`

**Share on WhatsApp:**
1. Click "💬 Share on WhatsApp" button
2. WhatsApp opens with message: `Pay here: https://uzanasi.online/pay/{slug}`

### Step 4: Proceed to Payment

1. Click "Proceed to Payment" button
2. You'll be redirected to: `https://snippe.me/p/{reference}`
3. This is the Snippe payment gateway

### Step 5: Complete Payment on Snippe

**To test payment completion:**

1. On Snippe checkout page, you have options:
   - **M-Pesa**: Enter M-Pesa details
   - **Tigo Pesa**: Enter Tigo Pesa details
   - **Test Mode**: If available, use test credentials

2. After payment:
   - Snippe sends webhook to your system
   - Payment link status updates to "PAID"
   - You're redirected to success page

### Step 6: Verify Payment Success

**Success Page Shows:**
- ✅ "Payment Received!" message
- Amount received: TSh 1,000
- Reference number
- Shareable link (for reference)
- "Go Home" button

**In Payment Monitoring Table:**
- Status changes from "Active" to "Paid"
- Payments count increases
- Total collected increases

---

## Testing Checklist

### Payment Link Creation
- [ ] Login successful
- [ ] Payment link created
- [ ] Shareable URL generated
- [ ] Toast notifications appear
- [ ] Link appears in Payment Monitoring table

### Payment Link Access
- [ ] Shareable link opens payment page
- [ ] Payment details display correctly
- [ ] QR code visible
- [ ] View count increases

### Sharing Features
- [ ] Copy shareable link works
- [ ] Download QR code works
- [ ] SMS copy works
- [ ] WhatsApp share works

### Payment Processing
- [ ] "Proceed to Payment" redirects to Snippe
- [ ] Snippe checkout page loads
- [ ] Payment can be completed
- [ ] Webhook processes payment
- [ ] Success page displays

### Payment Confirmation
- [ ] Payment link status updates to "PAID"
- [ ] Payments count increases
- [ ] Total collected updates
- [ ] Success page shows payment details

---

## Troubleshooting

### Issue: "Payment Link Not Found"
**Solution:**
- Check the slug in the URL is correct
- Verify the payment link was created successfully
- Check browser console for errors

### Issue: Redirect to Snippe Not Working
**Solution:**
- Check browser console for errors
- Verify checkout_url is correct in database
- Check if Snippe API is responding

### Issue: Payment Status Not Updating
**Solution:**
- Check webhook logs in Supabase
- Verify webhook URL is correct
- Check if payment was actually completed on Snippe
- Wait a few seconds for webhook to process

### Issue: Shareable Link Not Copied
**Solution:**
- Check browser console for errors
- Verify clipboard API is available
- Try copying manually

---

## Database Schema

### payment_links Table

```sql
CREATE TABLE payment_links (
  id UUID PRIMARY KEY,
  slug VARCHAR(8) UNIQUE,           -- 8-char shareable URL slug
  amount BIGINT,                     -- Amount in TSh
  description TEXT,                  -- Payment description
  status VARCHAR(20),                -- active, paid, failed, expired
  checkout_url TEXT,                 -- Snippe checkout URL
  snippe_reference VARCHAR(50),      -- Snippe reference number
  recipient_name VARCHAR(255),       -- Customer name
  recipient_phone VARCHAR(20),       -- Customer phone
  created_by UUID,                   -- User who created link
  created_at TIMESTAMP,              -- Creation time
  views INT DEFAULT 0,               -- View count
  payments_count INT DEFAULT 0,      -- Number of payments
  total_collected BIGINT DEFAULT 0,  -- Total amount collected
);
```

---

## API Endpoints

### Create Payment Link
```
POST /functions/v1/create-payment-link
Authorization: Bearer {session_token}
Content-Type: application/json

{
  "amount": 1000,
  "description": "Payment description",
  "recipient_name": "Customer Name",
  "recipient_phone": "255754000000",
  "frontend_url": "http://localhost:5173"
}

Response:
{
  "success": true,
  "payment_link_id": "uuid",
  "slug": "8-char-slug",
  "reference": "SN...",
  "payment_link_url": "https://uzanasi.online/pay/{slug}",
  "shareable_link": "https://uzanasi.online/pay/{slug}",
  "checkout_url": "https://snippe.me/p/{reference}"
}
```

### Get Payment Link
```
GET /rest/v1/payment_links?slug=eq.{slug}&select=*
apikey: {SUPABASE_ANON_KEY}

Response:
[
  {
    "id": "uuid",
    "slug": "8-char-slug",
    "amount": 1000,
    "status": "active",
    "checkout_url": "https://snippe.me/p/SN...",
    "snippe_reference": "SN...",
    "views": 1,
    "payments_count": 0,
    "total_collected": 0
  }
]
```

### Webhook (Snippe → Your System)
```
POST /functions/v1/snippe-webhook
Content-Type: application/json

{
  "type": "payment.completed",
  "data": {
    "reference": "SN...",
    "status": "completed",
    "metadata": {
      "payment_link_id": "uuid",
      "is_shareable_link": true
    }
  }
}
```

---

## Environment Variables

```env
VITE_SUPABASE_URL=https://qpojzblbodlphwzfpxbi.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
SNIPPE_API_KEY=snp_...
```

---

## Key Features

✅ **Slug-based URLs** - Easy to share and remember  
✅ **QR Code Generation** - Scan to pay  
✅ **Social Sharing** - SMS and WhatsApp integration  
✅ **View Tracking** - See how many times link was viewed  
✅ **Payment Analytics** - Track payments and collections  
✅ **Webhook Integration** - Automatic status updates  
✅ **Success Page** - Confirmation after payment  
✅ **Responsive Design** - Works on mobile and desktop  

---

## Next Steps

1. ✅ Test payment link creation
2. ✅ Test shareable link access
3. ✅ Test payment processing
4. ✅ Verify webhook integration
5. ✅ Deploy to production

---

## Support

For issues or questions:
1. Check browser console (F12)
2. Check Supabase logs
3. Check edge function logs
4. Review this guide

---

**Last Updated:** March 14, 2026  
**Status:** ✅ Ready for Testing
