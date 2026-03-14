# Complete Payment Link Flow Guide

## Your Payment Link

**Shareable URL:** `https://uzanasi.online/pay/h0j5nd5b`  
**Amount:** TSh 1,000  
**Status:** Active ✅

---

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    PAYMENT LINK FLOW                             │
└─────────────────────────────────────────────────────────────────┘

STEP 1: SHARE LINK
┌──────────────────────────────────────────────────────────────┐
│ You share: https://uzanasi.online/pay/h0j5nd5b              │
│                                                               │
│ Via: SMS, WhatsApp, QR Code, Email, etc.                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 2: CUSTOMER OPENS LINK
┌──────────────────────────────────────────────────────────────┐
│ Customer opens link in browser                               │
│ ✅ Sees payment details                                      │
│ ✅ Sees QR code                                              │
│ ✅ Sees share buttons                                        │
│ ✅ Sees "Proceed to Payment" button                          │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 3: PAYMENT PAGE LOADS
┌──────────────────────────────────────────────────────────────┐
│ PaymentPage.tsx fetches payment link by slug                 │
│ ✅ Displays: TSh 1,000                                       │
│ ✅ Displays: Share link section                              │
│ ✅ Displays: QR code                                         │
│ ✅ Displays: SMS/WhatsApp buttons                            │
│ ✅ Increments: Views counter                                 │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 4: CUSTOMER CLICKS "PROCEED TO PAYMENT"
┌──────────────────────────────────────────────────────────────┐
│ Redirects to Snippe checkout:                                │
│ https://snippe.me/p/SN17734693211441088                      │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 5: CUSTOMER COMPLETES PAYMENT
┌──────────────────────────────────────────────────────────────┐
│ Customer enters mobile money PIN                             │
│ Payment processed by Snippe                                  │
│ ✅ Payment confirmed                                         │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 6: SNIPPE SENDS WEBHOOK
┌──────────────────────────────────────────────────────────────┐
│ Snippe sends: payment.completed event                        │
│ To: /functions/v1/snippe-webhook                            │
│ With: { reference, status, metadata }                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 7: WEBHOOK PROCESSES PAYMENT
┌──────────────────────────────────────────────────────────────┐
│ snippe-webhook edge function:                                │
│ ✅ Updates payment_links status to "paid"                    │
│ ✅ Increments payments_count                                 │
│ ✅ Adds to total_collected                                   │
│ ✅ Sends SMS notification                                    │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 8: ANALYTICS UPDATED
┌──────────────────────────────────────────────────────────────┐
│ Payment Link Analytics:                                      │
│ • Views: 1 (incremented when page opened)                   │
│ • Payments: 1 (incremented when paid)                       │
│ • Collected: TSh 1,000 (total amount)                       │
└──────────────────────────────────────────────────────────────┘
                            ↓
STEP 9: PAYMENT CONFIRMED ✅
┌──────────────────────────────────────────────────────────────┐
│ Payment link status: PAID                                    │
│ Funds: Held in escrow                                        │
│ Ready for: Delivery or withdrawal                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Payment Link Page Features

### Share Link Section (Main Focus)
```
┌─────────────────────────────────────────────────────────────┐
│ 📤 Share This Payment Link                                   │
│                                                               │
│ Copy and share this link with customers. They can pay       │
│ directly from this link!                                     │
│                                                               │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ https://uzanasi.online/pay/h0j5nd5b                     │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [Copy]                                                       │
│                                                               │
│ [📱 Copy for SMS]  [💬 Share on WhatsApp]                   │
└─────────────────────────────────────────────────────────────┘
```

### QR Code Section
```
┌─────────────────────────────────────────────────────────────┐
│ Scan to Pay                                                  │
│                                                               │
│         ┌─────────────────┐                                  │
│         │                 │                                  │
│         │   [QR CODE]     │                                  │
│         │                 │                                  │
│         └─────────────────┘                                  │
│                                                               │
│ [Download QR Code]                                           │
└─────────────────────────────────────────────────────────────┘
```

### Payment Amount Section
```
┌─────────────────────────────────────────────────────────────┐
│ Amount to Pay                                                │
│                                                               │
│         TSh 1,000                                            │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Analytics Section
```
┌─────────────────────────────────────────────────────────────┐
│ Views: 1    │    Payments: 0    │    Collected: TSh 0       │
└─────────────────────────────────────────────────────────────┘
```

---

## Testing Checklist

### ✅ Link Creation
- [x] Payment link created with slug: h0j5nd5b
- [x] Snippe reference: SN17734693211441088
- [x] Amount: TSh 1,000
- [x] Status: Active

### ⏳ Link Display (Test in Browser)
- [ ] Open: http://localhost:5173/pay/h0j5nd5b
- [ ] Verify: Payment amount displays
- [ ] Verify: Share link section visible
- [ ] Verify: QR code visible
- [ ] Verify: SMS/WhatsApp buttons visible

### ⏳ Share Features (Test Each)
- [ ] Copy button: Click → Paste → Verify URL
- [ ] SMS copy: Click → Verify message format
- [ ] WhatsApp: Click → Opens WhatsApp
- [ ] QR code: Scan → Opens payment link
- [ ] Download QR: Click → Saves PNG file

### ⏳ Payment Flow (Test Complete)
- [ ] Click "Proceed to Payment"
- [ ] Redirects to Snippe checkout
- [ ] Complete payment (or cancel)
- [ ] Verify webhook received
- [ ] Verify status updated to "paid"
- [ ] Verify analytics updated

---

## Key URLs

| Purpose | URL |
|---------|-----|
| **Shareable Link** | https://uzanasi.online/pay/h0j5nd5b |
| **Test Link (Local)** | http://localhost:5173/pay/h0j5nd5b |
| **Snippe Checkout** | https://snippe.me/p/SN17734693211441088 |
| **SMS Message** | Pay here: https://uzanasi.online/pay/h0j5nd5b |
| **WhatsApp Link** | https://wa.me/?text=Pay%20here:%20https://uzanasi.online/pay/h0j5nd5b |

---

## Edge Functions Used

| Function | Purpose | Status |
|----------|---------|--------|
| create-payment-link | Created this link | ✅ Deployed |
| snippe-webhook | Processes payment | ✅ Deployed |
| briq-sms | Sends SMS notification | ✅ Deployed |
| auto-release-escrow | Releases funds | ✅ Deployed |

---

## Database Records

### payment_links Table
```
id:                f12679c7-fbbd-4d69-a6f7-cb454b4f9224
slug:              h0j5nd5b
snippe_reference:  SN17734693211441088
amount:            1000
status:            active
created_at:        2026-03-14 06:22:04.884+00
views:             0 (increments when page opened)
payments_count:    0 (increments when paid)
total_collected:   0 (increments with payment amount)
```

---

## What Happens Next

### When Customer Opens Link
1. PaymentPage.tsx fetches payment link by slug
2. Displays payment details and share options
3. Increments views counter
4. Shows QR code and share buttons

### When Customer Pays
1. Clicks "Proceed to Payment"
2. Redirects to Snippe checkout
3. Enters mobile money PIN
4. Payment processed

### When Payment Completes
1. Snippe sends webhook
2. snippe-webhook updates payment_links status
3. Increments payments_count
4. Adds to total_collected
5. Sends SMS notification
6. Funds held in escrow

---

## Summary

✅ **Payment Link Created Successfully**

- **Shareable URL:** https://uzanasi.online/pay/h0j5nd5b
- **Amount:** TSh 1,000
- **Status:** Active
- **Ready to:** Share with customers

**Next Steps:**
1. Test the link in browser
2. Share with customers
3. Monitor analytics
4. Collect payments

---

**Status:** ✅ Ready to Use
