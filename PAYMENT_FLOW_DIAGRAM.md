# Payment Flow Diagram

## Complete Payment Journey

```
┌─────────────────────────────────────────────────────────────────┐
│ MERCHANT (You)                                                  │
│ Creates payment link for TSh 15,000                             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ SYSTEM GENERATES TWO LINKS                                      │
│                                                                 │
│ Link 1 (OUR): https://uzanasi.online/pay/liux7m96              │
│ Link 2 (SNIPPE): https://snippe.me/p/SN17734681375356016       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ MERCHANT SHARES LINK 1 WITH CUSTOMER                            │
│                                                                 │
│ "Please pay here: https://uzanasi.online/pay/liux7m96"         │
│                                                                 │
│ Via: SMS, WhatsApp, Email, QR Code, etc.                       │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER VISITS LINK 1                                          │
│ https://uzanasi.online/pay/liux7m96                             │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Payment Request                                           │  │
│ │                                                           │  │
│ │ Amount: TSh 15,000                                        │  │
│ │ [QR Code]                                                 │  │
│ │ Reference: SN17734681375356016                            │  │
│ │ Recipient: Your Business                                  │  │
│ │ Phone: 255754000000                                       │  │
│ │                                                           │  │
│ │ [Proceed to Payment]                                      │  │
│ └───────────────────────────────────────────────────────────┘  │
│                                                                 │
│ ✅ View tracked: views = 1                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER CLICKS "PROCEED TO PAYMENT"                            │
│                                                                 │
│ Redirects to Link 2:                                            │
│ https://snippe.me/p/SN17734681375356016                         │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ SNIPPE PAYMENT PAGE                                             │
│ https://snippe.me/p/SN17734681375356016                         │
│                                                                 │
│ ┌───────────────────────────────────────────────────────────┐  │
│ │ Snippe Checkout                                           │  │
│ │                                                           │  │
│ │ Amount: TSh 15,000                                        │  │
│ │ Phone: 255754000000                                       │  │
│ │ Customer: John Doe                                        │  │
│ │                                                           │  │
│ │ [Enter M-Pesa PIN]                                        │  │
│ │ [Confirm Payment]                                         │  │
│ └───────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ CUSTOMER ENTERS M-PESA PIN                                      │
│                                                                 │
│ Snippe processes payment with mobile money provider             │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ PAYMENT CONFIRMED                                               │
│                                                                 │
│ ✅ Payment successful                                           │
│ ✅ Webhook received                                             │
│ ✅ Database updated:                                            │
│    - status: active → paid                                      │
│    - payments_count: 0 → 1                                      │
│    - total_collected: 0 → 15000                                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ MERCHANT RECEIVES PAYMENT                                       │
│                                                                 │
│ ✅ TSh 15,000 received                                          │
│ ✅ Order confirmed                                              │
│ ✅ Delivery initiated                                           │
└─────────────────────────────────────────────────────────────────┘
```

## Link Comparison

```
┌──────────────────────────────────────────────────────────────────┐
│                    OUR LINK vs SNIPPE LINK                       │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│ OUR LINK (uzanasi.online)                                        │
│ ├─ URL: https://uzanasi.online/pay/liux7m96                     │
│ ├─ Purpose: Shareable payment request                            │
│ ├─ Shows: Amount, QR code, reference, recipient                 │
│ ├─ Tracks: Views, analytics                                     │
│ ├─ User sees: Professional payment page                          │
│ └─ Action: Click "Proceed to Payment"                            │
│                                                                  │
│ SNIPPE LINK (snippe.me)                                          │
│ ├─ URL: https://snippe.me/p/SN17734681375356016                 │
│ ├─ Purpose: Actual payment processing                            │
│ ├─ Shows: Amount, phone, customer info                           │
│ ├─ Tracks: Payment status                                        │
│ ├─ User sees: Snippe checkout page                               │
│ └─ Action: Enter M-Pesa PIN                                      │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

## Database Storage

```
payment_links table
│
├─ id: d7ad20d8-7a35-4df4-9a80-194f375e5caf
├─ slug: liux7m96
├─ amount: 15000
├─ status: active
├─ snippe_reference: SN17734681375356016
├─ checkout_url: https://snippe.me/p/SN17734681375356016
├─ views: 1
├─ payments_count: 0
└─ total_collected: 0
```

## API Response

```json
{
  "success": true,
  "slug": "liux7m96",
  "reference": "SN17734681375356016",
  "payment_link_url": "https://uzanasi.online/pay/liux7m96",
  "checkout_url": "https://snippe.me/p/SN17734681375356016"
}
```

## Summary

```
SHARE:    https://uzanasi.online/pay/liux7m96
          ↓ (customer clicks button)
REDIRECT: https://snippe.me/p/SN17734681375356016
          ↓ (customer pays)
CONFIRM:  ✅ Payment successful
```

Both links are needed for the complete payment flow!
