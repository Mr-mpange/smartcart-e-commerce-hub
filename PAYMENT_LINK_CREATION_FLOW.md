# Payment Link Creation Flow - Complete Guide

**Status:** ✅ FIXED - Shareable Link Now Displayed

---

## What Happens When You Create a Payment Link

### Step 1: Open Payment Monitoring
- Go to Payment Monitoring section
- Click "Create Payment Link" button

### Step 2: Fill Form
- Enter amount (e.g., 1,000)
- Optional: Recipient name
- Optional: Recipient phone
- Optional: Description
- Click "Generate Payment Link"

### Step 3: Edge Function Processes
**Behind the scenes:**
1. Edge function generates 8-character slug: `h0j5nd5b`
2. Calls Snippe API to create payment
3. Receives Snippe reference: `SN17734693211441088`
4. Stores in database with slug
5. Returns response with BOTH links

### Step 4: Response Returned

**Edge Function Returns:**
```json
{
  "success": true,
  "slug": "h0j5nd5b",
  "payment_link_url": "https://uzanasi.online/pay/h0j5nd5b",
  "checkout_url": "https://snippe.me/p/SN17734693211441088",
  "reference": "SN17734693211441088",
  "message": "Payment link created successfully. Share this link to receive payments."
}
```

### Step 5: UI Shows Success

**Toast Notifications:**
1. ✅ "Payment link created! Shareable: https://uzanasi.online/pay/h0j5nd5b"
2. ✅ "Shareable link copied to clipboard!"

**What This Means:**
- Shareable link is automatically copied to your clipboard
- You can immediately paste and share it

### Step 6: Table Updates

**In PaymentMonitoring table, you'll see:**

```
Reference: SN17734693211441088
Amount: TSh 1,000
Recipient: No name provided
Status: Active
Created: Mar 14, 09:22 AM

Actions:
┌─────────────────────────────────────────┐
│ Shareable Link:                         │
│ https://uzanasi.online/pay/h0j5nd5b    │
│                                         │
│ [Copy Shareable Link] [Open Link]      │
│ [Copy Snippe Link]    [Delete]         │
└─────────────────────────────────────────┘
```

---

## Two Links in Response

### 1. Shareable Link (What You Share)
```
https://uzanasi.online/pay/h0j5nd5b
```
- **In Response:** `payment_link_url`
- **Purpose:** Share with customers
- **What it shows:** Payment details, QR code, share buttons
- **Where it goes:** Stays on our platform
- **Display:** Prominent in table with copy button

### 2. Snippe Checkout Link (Where They Pay)
```
https://snippe.me/p/SN17734693211441088
```
- **In Response:** `checkout_url`
- **Purpose:** Where customer actually pays
- **What it does:** Processes payment via Snippe
- **Where it goes:** Redirects to Snippe payment gateway
- **Display:** Available as "Copy Snippe Link" button

---

## Complete Payment Flow

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CREATE PAYMENT LINK                                      │
│    - Enter amount                                           │
│    - Click "Generate Payment Link"                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. EDGE FUNCTION PROCESSES                                  │
│    - Generate slug: h0j5nd5b                                │
│    - Call Snippe API                                        │
│    - Get reference: SN17734693211441088                     │
│    - Store in database                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. RESPONSE RETURNED                                        │
│    - Shareable: https://uzanasi.online/pay/h0j5nd5b       │
│    - Checkout: https://snippe.me/p/SN17734693211441088    │
│    - Reference: SN17734693211441088                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. UI SHOWS SUCCESS                                         │
│    - Toast: "Payment link created!"                         │
│    - Toast: "Shareable link copied to clipboard!"           │
│    - Table: Shows shareable link with copy button           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. YOU SHARE LINK                                           │
│    - Copy from table or clipboard                           │
│    - Share via SMS/WhatsApp                                 │
│    - Share QR code                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. CUSTOMER OPENS LINK                                      │
│    - Opens: https://uzanasi.online/pay/h0j5nd5b           │
│    - Sees payment details                                   │
│    - Sees QR code                                           │
│    - Sees share buttons                                     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. CUSTOMER PROCEEDS TO PAYMENT                             │
│    - Clicks "Proceed to Payment"                            │
│    - Redirects to: https://snippe.me/p/SN17734693211441088│
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. CUSTOMER COMPLETES PAYMENT                               │
│    - Enters mobile money PIN                                │
│    - Payment processed                                      │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. WEBHOOK CONFIRMS PAYMENT                                 │
│    - Snippe sends webhook                                   │
│    - Order status updated to "confirmed"                    │
│    - Funds held in escrow                                   │
│    - SMS notification sent                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 10. ANALYTICS UPDATED                                       │
│     - Views: 1                                              │
│     - Payments: 1                                           │
│     - Collected: TSh 1,000                                  │
└─────────────────────────────────────────────────────────────┘
```

---

## What You'll See in Toast Notifications

### Success Notifications

**Notification 1 (10 seconds):**
```
✅ Payment link created! Shareable: https://uzanasi.online/pay/h0j5nd5b
```

**Notification 2 (5 seconds):**
```
ℹ️ Shareable link copied to clipboard!
```

### What This Means
- Your shareable link is ready to share
- It's already in your clipboard
- You can paste it immediately

---

## What You'll See in Table

### Payment Link Entry

```
┌──────────────────────────────────────────────────────────────────┐
│ Reference: SN17734693211441088                                   │
│ Amount: TSh 1,000                                                │
│ Recipient: No name provided / No phone provided                  │
│ Status: Active                                                   │
│ Created: Mar 14, 09:22 AM                                        │
│                                                                  │
│ Actions:                                                         │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Shareable Link:                                            │  │
│ │ https://uzanasi.online/pay/h0j5nd5b                       │  │
│ │                                                            │  │
│ │ [Copy Shareable Link] [Open Link]                         │  │
│ │ [Copy Snippe Link]    [Delete]                            │  │
│ └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Button Functions

1. **Copy Shareable Link**
   - Copies: `https://uzanasi.online/pay/h0j5nd5b`
   - Use to share with customers

2. **Open Link**
   - Opens payment page in new tab
   - Shows payment details and QR code

3. **Copy Snippe Link**
   - Copies: `https://snippe.me/p/SN17734693211441088`
   - For reference only

4. **Delete**
   - Removes payment link from system

---

## Testing Steps

### Step 1: Create Payment Link
1. Go to Payment Monitoring
2. Click "Create Payment Link"
3. Enter amount: 1000
4. Click "Generate Payment Link"

### Step 2: Verify Toast Notifications
- ✅ See "Payment link created!" notification
- ✅ See "Shareable link copied to clipboard!" notification

### Step 3: Verify Table Display
- ✅ See shareable link in blue box
- ✅ See "Copy Shareable Link" button
- ✅ See "Open Link" button

### Step 4: Test Copy Button
1. Click "Copy Shareable Link"
2. Paste (Ctrl+V) in notepad
3. Verify: `https://uzanasi.online/pay/{slug}`

### Step 5: Test Open Link
1. Click "Open Link"
2. Verify payment page loads
3. Verify payment details display
4. Verify QR code visible

### Step 6: Test Payment Flow
1. Click "Proceed to Payment"
2. Verify redirects to Snippe
3. Complete payment (or cancel)
4. Verify status updates

---

## Summary

✅ **Edge function returns shareable link**  
✅ **Toast notifications show shareable link**  
✅ **Shareable link copied to clipboard**  
✅ **Table displays shareable link prominently**  
✅ **Copy button available for easy sharing**  

**Status:** Ready to use!

---

**Last Updated:** March 14, 2026  
**Status:** ✅ COMPLETE
