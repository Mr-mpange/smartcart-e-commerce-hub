# Quick Reference - Payment Links

## Two Links Explained

### Link 1: OUR Payment Link
```
https://uzanasi.online/pay/liux7m96
```
- **What:** Shareable payment request
- **Who:** You share this with customers
- **Shows:** Amount, QR code, reference
- **Action:** Customer clicks "Proceed to Payment"

### Link 2: SNIPPE Checkout Link
```
https://snippe.me/p/SN17734681375356016
```
- **What:** Actual payment page
- **Who:** Customer uses this to pay
- **Shows:** Payment form, M-Pesa PIN entry
- **Action:** Customer enters PIN and pays

## Flow

```
1. Create payment link
   ↓
2. Get two links:
   - OUR: https://uzanasi.online/pay/liux7m96
   - SNIPPE: https://snippe.me/p/SN17734681375356016
   ↓
3. Share OUR link with customer
   ↓
4. Customer visits OUR link
   ↓
5. Customer clicks button
   ↓
6. Redirected to SNIPPE link
   ↓
7. Customer pays
   ↓
8. ✅ Payment confirmed
```

## Example

**You want to receive TSh 15,000**

1. Create payment link: Amount = 15,000
2. System generates:
   - Share this: `https://uzanasi.online/pay/liux7m96`
   - Redirects to: `https://snippe.me/p/SN17734681375356016`
3. Send to customer: "Pay here: https://uzanasi.online/pay/liux7m96"
4. Customer visits link, sees amount and QR code
5. Customer clicks "Proceed to Payment"
6. Redirected to Snippe
7. Customer enters M-Pesa PIN
8. ✅ You receive TSh 15,000

## Key Points

✅ **OUR link** = Invoice/Receipt (what you share)
✅ **SNIPPE link** = Payment terminal (where they pay)
✅ Both are needed
✅ Both are automatically generated
✅ Both are stored in database

## API Response

```json
{
  "payment_link_url": "https://uzanasi.online/pay/liux7m96",
  "checkout_url": "https://snippe.me/p/SN17734681375356016"
}
```

- Use `payment_link_url` to share
- `checkout_url` is used internally for redirect

## Database

```
payment_links:
- slug: liux7m96
- checkout_url: https://snippe.me/p/SN17734681375356016
- snippe_reference: SN17734681375356016
- views: 1
- payments_count: 0
```

## Why Two?

**Analogy:**
- OUR link = Sending invoice via email
- SNIPPE link = Customer going to bank to pay

You send the invoice, they go to the bank to pay.

## Summary

```
SHARE THIS:     https://uzanasi.online/pay/liux7m96
REDIRECTS TO:   https://snippe.me/p/SN17734681375356016
```

That's it! Both links work together for complete payment flow.
