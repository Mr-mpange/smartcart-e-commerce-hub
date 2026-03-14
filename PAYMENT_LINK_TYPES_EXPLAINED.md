# Two Types of Payment Links - Explained

## The Confusion
You see TWO different links:
1. `https://uzanasi.online/pay/liux7m96` ← Our link
2. `https://snippe.me/p/SN17734681375356016` ← Snippe link

## Why Two Links?

### Link 1: OUR Payment Link (Shareable)
```
https://uzanasi.online/pay/liux7m96
```

**Purpose:** Share with customers
**What it does:**
- Shows payment details
- Displays QR code
- Shows amount, recipient, reference
- Has "Proceed to Payment" button
- Tracks views and analytics

**Who uses it:** You share this with customers

### Link 2: SNIPPE Checkout Link (Payment Page)
```
https://snippe.me/p/SN17734681375356016
```

**Purpose:** Actual payment processing
**What it does:**
- Snippe's payment page
- User enters M-Pesa PIN
- Processes payment
- Confirms transaction

**Who uses it:** Customers click button to pay

## Complete Flow

```
1. You create payment link
   ↓
2. System generates:
   - Our link: https://uzanasi.online/pay/liux7m96
   - Snippe link: https://snippe.me/p/SN17734681375356016
   ↓
3. You share OUR link with customer
   ↓
4. Customer visits: https://uzanasi.online/pay/liux7m96
   ↓
5. Customer sees:
   - Amount: TSh 15,000
   - QR Code
   - Reference: SN17734681375356016
   - "Proceed to Payment" button
   ↓
6. Customer clicks button
   ↓
7. Redirected to Snippe: https://snippe.me/p/SN17734681375356016
   ↓
8. Customer enters M-Pesa PIN
   ↓
9. Payment confirmed
```

## Example

### Scenario: Selling Product for TSh 15,000

**Step 1: Create Payment Link**
```
Amount: 15,000
Description: Product Sale
```

**Step 2: System Generates**
```
Our Link: https://uzanasi.online/pay/liux7m96
Snippe Link: https://snippe.me/p/SN17734681375356016
```

**Step 3: Share with Customer**
```
"Please pay here: https://uzanasi.online/pay/liux7m96"
```

**Step 4: Customer Visits Our Link**
```
URL: https://uzanasi.online/pay/liux7m96

Page shows:
┌─────────────────────────────────┐
│  Payment Request                │
│                                 │
│  Amount: TSh 15,000             │
│  [QR Code]                      │
│  Reference: SN17734681375356016 │
│  Recipient: Your Name           │
│                                 │
│  [Proceed to Payment]           │
└─────────────────────────────────┘
```

**Step 5: Customer Clicks Button**
```
Redirects to: https://snippe.me/p/SN17734681375356016
```

**Step 6: Snippe Payment Page**
```
URL: https://snippe.me/p/SN17734681375356016

Page shows:
┌─────────────────────────────────┐
│  Snippe Checkout                │
│                                 │
│  Amount: TSh 15,000             │
│  Phone: 255754000000            │
│                                 │
│  [Enter M-Pesa PIN]             │
│  [Confirm]                      │
└─────────────────────────────────┘
```

**Step 7: Payment Confirmed**
```
✅ Payment successful
✅ Money received
✅ Order confirmed
```

## Key Points

### OUR Link (uzanasi.online)
- ✅ Shareable
- ✅ Shows details
- ✅ Tracks analytics
- ✅ Professional appearance
- ✅ QR code support
- ✅ What you SHARE

### SNIPPE Link (snippe.me)
- ✅ Payment processing
- ✅ Secure checkout
- ✅ Mobile money integration
- ✅ What customers USE to PAY

## Why Both?

**Analogy:**
- OUR link = Invoice/Receipt
- SNIPPE link = Payment terminal

You send the invoice, customer uses the terminal to pay.

## Summary

```
SHARE THIS:     https://uzanasi.online/pay/liux7m96
REDIRECTS TO:   https://snippe.me/p/SN17734681375356016
```

Both are needed for the complete payment flow!

## Database Storage

```
payment_links table:
├── id: d7ad20d8-7a35-4df4-9a80-194f375e5caf
├── slug: liux7m96
├── amount: 15000
├── status: active
├── snippe_reference: SN17734681375356016
├── checkout_url: https://snippe.me/p/SN17734681375356016
└── views: 0
```

## API Response

When you create a payment link, you get:
```json
{
  "success": true,
  "slug": "liux7m96",
  "reference": "SN17734681375356016",
  "payment_link_url": "https://uzanasi.online/pay/liux7m96",
  "checkout_url": "https://snippe.me/p/SN17734681375356016"
}
```

- `payment_link_url` = Share this
- `checkout_url` = Redirects to this
