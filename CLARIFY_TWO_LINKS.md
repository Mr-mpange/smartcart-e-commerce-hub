# Clarify: Two Different Links - What's What

**Status:** Explaining the system  
**Date:** March 14, 2026

---

## The Confusion

You're seeing TWO different links and wondering which one is correct:

1. **Shareable Link:** `https://uzanasi.online/pay/h0j5nd5b`
2. **Snippe Checkout Link:** `https://snippe.me/p/SN17734705053648315`

**Both are correct!** They serve different purposes.

---

## Two Links Explained

### 1. Shareable Link (What You Share)
```
https://uzanasi.online/pay/h0j5nd5b
```

**Purpose:** This is what you share with customers  
**What it shows:** Payment details, QR code, share buttons  
**Where it goes:** Stays on our platform  
**Returned by edge function as:** `payment_link_url`  
**Stored in database as:** Constructed from `slug`  

**Example Flow:**
```
You share: https://uzanasi.online/pay/h0j5nd5b
↓
Customer opens link
↓
Sees payment details and QR code
↓
Clicks "Proceed to Payment"
↓
Redirects to Snippe checkout
```

### 2. Snippe Checkout Link (Where They Pay)
```
https://snippe.me/p/SN17734705053648315
```

**Purpose:** Where customer actually pays  
**What it does:** Processes payment via Snippe  
**Where it goes:** Redirects to Snippe payment gateway  
**Returned by edge function as:** `checkout_url`  
**Stored in database as:** `checkout_url` field  

**Example Flow:**
```
Customer clicks "Proceed to Payment"
↓
Redirects to: https://snippe.me/p/SN17734705053648315
↓
Snippe payment page loads
↓
Customer enters mobile money PIN
↓
Payment processed
```

---

## Edge Function Returns BOTH

**Response from create-payment-link:**

```json
{
  "success": true,
  "slug": "h0j5nd5b",
  "payment_link_url": "https://uzanasi.online/pay/h0j5nd5b",
  "checkout_url": "https://snippe.me/p/SN17734705053648315",
  "reference": "SN17734705053648315"
}
```

**Key Fields:**
- ✅ `payment_link_url`: **SHAREABLE LINK** (what you share)
- ✅ `checkout_url`: **SNIPPE LINK** (where they pay)
- ✅ `slug`: **8-character identifier** (used in shareable link)
- ✅ `reference`: **Snippe reference** (used in checkout link)

---

## What Gets Stored in Database

**payment_links table:**

| Field | Value | Purpose |
|-------|-------|---------|
| `id` | UUID | Unique identifier |
| `slug` | `h0j5nd5b` | Used to construct shareable link |
| `checkout_url` | `https://snippe.me/p/SN...` | Snippe payment URL |
| `snippe_reference` | `SN17734705053648315` | Snippe payment reference |
| `status` | `active` | Payment link status |

---

## What UI Shows

### In Toast Notification (After Creation)
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/h0j5nd5b
ℹ️ Shareable link copied to clipboard!
```

### In PaymentMonitoring Table
```
Reference: SN17734705053648315
Amount: TSh 1,000
Status: Active

Shareable Link:
https://uzanasi.online/pay/h0j5nd5b

[Copy Shareable Link] [Open Link] [Copy Snippe Link] [Delete]
```

### When Customer Opens Shareable Link
**URL:** `http://localhost:5173/pay/h0j5nd5b`

**Page Shows:**
- Payment amount
- Share link section
- QR code (encodes shareable link)
- "Proceed to Payment" button

### When Customer Clicks "Proceed to Payment"
**Redirects to:** `https://snippe.me/p/SN17734705053648315`

**Snippe Page Shows:**
- Payment form
- Mobile money options
- PIN entry

---

## Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. YOU CREATE PAYMENT LINK                                  │
│    - Amount: 1,000 TSh                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EDGE FUNCTION PROCESSES                                  │
│    - Generates slug: h0j5nd5b                               │
│    - Calls Snippe API                                       │
│    - Gets reference: SN17734705053648315                    │
│    - Returns BOTH links:                                    │
│      * Shareable: https://uzanasi.online/pay/h0j5nd5b     │
│      * Checkout: https://snippe.me/p/SN...                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. YOU SHARE SHAREABLE LINK                                 │
│    - Copy: https://uzanasi.online/pay/h0j5nd5b            │
│    - Share via SMS/WhatsApp                                 │
│    - Share QR code                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. CUSTOMER OPENS SHAREABLE LINK                            │
│    - Opens: https://uzanasi.online/pay/h0j5nd5b           │
│    - Sees payment details                                   │
│    - Sees QR code                                           │
│    - Sees share buttons                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. CUSTOMER CLICKS "PROCEED TO PAYMENT"                     │
│    - Redirects to: https://snippe.me/p/SN...              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CUSTOMER COMPLETES PAYMENT ON SNIPPE                     │
│    - Enters mobile money PIN                                │
│    - Payment processed                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. WEBHOOK CONFIRMS PAYMENT                                 │
│    - Snippe sends webhook                                   │
│    - Order status updated                                   │
│    - Funds held in escrow                                   │
│    - SMS notification sent                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## Summary

**Two Links = Two Purposes:**

1. **Shareable Link** (`https://uzanasi.online/pay/h0j5nd5b`)
   - What you share with customers
   - Shows payment details and QR code
   - Stays on our platform

2. **Snippe Checkout Link** (`https://snippe.me/p/SN17734705053648315`)
   - Where customer actually pays
   - Processes payment via Snippe
   - Redirects to Snippe payment gateway

**Both are correct and necessary!**

---

**Status:** ✅ System working as designed
