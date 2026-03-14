# How to Create Payment Links with Snippe - Complete Guide

## Overview
Payment links are created through a 3-step process:
1. **Frontend** - User initiates payment (checkout form)
2. **Edge Function** - Calls Snippe API to create payment
3. **Database** - Stores payment link for tracking

## Step-by-Step Process

### STEP 1: User Initiates Payment (Frontend)

**File:** `src/pages/Checkout.tsx`

User fills checkout form:
```
Customer Information
├── Full Name: "John Doe"
├── Email: "john@example.com"
├── Phone: "255754000000"
├── Address: "Dar es Salaam"
└── Payment Method: "mobile_money"
```

When user clicks "Place Order", the form calls the edge function:

```typescript
const { data, error } = await supabase.functions.invoke('snippe-payment', {
  body: {
    order_id: order.id,
    buyer_email: formData.email,
    buyer_name: formData.name,
    buyer_phone: formData.phone,
    amount: total,
  },
  headers: {
    Authorization: `Bearer ${session.access_token}`,
  },
});
```

### STEP 2: Edge Function Calls Snippe API

**File:** `supabase/functions/create-payment-link/index.ts`

The edge function receives the request and:

#### 2a. Generate Slug
```typescript
const generateSlug = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 8 }, () => 
    chars[Math.floor(Math.random() * chars.length)]
  ).join('');
};
const slug = generateSlug(); // "abc12345"
```

#### 2b. Format Phone Number
```typescript
// Input: "+255754000000" or "0754000000"
// Output: "255754000000" (required by Snippe)

let phoneNumber = '255754000000'; // Default
if (recipient_phone && recipient_phone.trim()) {
  let phone = recipient_phone.trim().replace(/[^0-9]/g, '');
  if (phone.startsWith('0')) {
    phone = '255' + phone.substring(1);
  }
  if (phone.startsWith('255')) {
    phoneNumber = phone;
  }
}
```

#### 2c. Create Snippe Payload
```typescript
const paymentPayload = {
  payment_type: 'mobile',
  details: {
    amount: 10000,           // Amount in cents (TSh)
    currency: 'TZS',         // Tanzanian Shilling
  },
  phone_number: '255754000000',  // Customer phone
  customer: {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john@example.com',
  },
  webhook_url: 'https://uzanasi.online/functions/v1/snippe-webhook',
  redirect_url: 'https://uzanasi.online/pay/abc12345',
  metadata: {
    payment_link_id: 'uuid-here',
    payment_link_slug: 'abc12345',
    order_id: 'order-uuid',
    created_by: 'user-uuid',
    is_shareable_link: true
  },
};
```

#### 2d. Call Snippe API
```typescript
const snippeResponse = await fetch('https://api.snippe.sh/v1/payments', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SNIPPE_API_KEY}`,
    'Content-Type': 'application/json',
    'Idempotency-Key': `link-${linkId}`,
  },
  body: JSON.stringify(paymentPayload),
});

const snippeData = await snippeResponse.json();
// Response:
// {
//   "data": {
//     "reference": "SN17734359215794741",
//     "status": "pending",
//     "amount": 10000,
//     "currency": "TZS"
//   }
// }
```

#### 2e. Extract Snippe Reference
```typescript
const reference = snippeData.data.reference; // "SN17734359215794741"
const snippeCheckoutUrl = `https://snippe.me/checkout/${reference}`;
// Result: https://snippe.me/checkout/SN17734359215794741
```

### STEP 3: Save to Database

**File:** `supabase/functions/create-payment-link/index.ts`

Save the payment link with all details:

```typescript
const { error: dbError } = await adminClient
  .from('payment_links')
  .insert({
    id: linkId,                    // UUID for internal tracking
    slug: slug,                    // "abc12345" for URL
    amount: 10000,                 // Amount in cents
    description: 'Order #123',     // Optional description
    status: 'active',              // Link status
    checkout_url: snippeCheckoutUrl,  // Snippe checkout URL
    snippe_reference: reference,   // Snippe reference
    recipient_name: 'John Doe',    // Customer name
    recipient_phone: '255754000000',  // Customer phone
    created_by: user.id,           // User who created link
    created_at: new Date().toISOString(),
    views: 0,                      // View tracking
    payments_count: 0,             // Payment counting
    total_collected: 0             // Amount collected
  });
```

### STEP 4: Return Response to Frontend

```typescript
return new Response(JSON.stringify({
  success: true,
  payment_link_id: linkId,
  slug: slug,                    // "abc12345"
  reference: reference,          // "SN17734359215794741"
  payment_link: paymentLink,
  payment_link_url: `https://uzanasi.online/pay/${slug}`,
  checkout_url: snippeCheckoutUrl,
  message: 'Payment link created successfully.'
}), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
```

## Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND - User Checkout                                     │
│                                                                 │
│  User fills form:                                               │
│  - Name: "John Doe"                                             │
│  - Phone: "255754000000"                                        │
│  - Amount: 10000 TSh                                            │
│                                                                 │
│  Clicks "Place Order"                                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. EDGE FUNCTION - create-payment-link                          │
│                                                                 │
│  a) Generate slug: "abc12345"                                   │
│  b) Format phone: "255754000000"                                │
│  c) Create payload for Snippe                                   │
│  d) Call Snippe API                                             │
│  e) Get reference: "SN17734359215794741"                        │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 3. SNIPPE API - Process Payment                                 │
│                                                                 │
│  Snippe receives:                                               │
│  - Amount: 10000 TSh                                            │
│  - Phone: 255754000000                                          │
│  - Customer: John Doe                                           │
│                                                                 │
│  Returns:                                                       │
│  - Reference: "SN17734359215794741"                             │
│  - Status: "pending"                                            │
│  - Checkout URL: https://snippe.me/checkout/SN...              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. DATABASE - Save Payment Link                                 │
│                                                                 │
│  payment_links table:                                           │
│  - id: uuid                                                     │
│  - slug: "abc12345"                                             │
│  - amount: 10000                                                │
│  - snippe_reference: "SN17734359215794741"                      │
│  - status: "active"                                             │
│  - views: 0                                                     │
│  - payments_count: 0                                            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. RESPONSE - Return to Frontend                                │
│                                                                 │
│  {                                                              │
│    "success": true,                                             │
│    "slug": "abc12345",                                          │
│    "reference": "SN17734359215794741",                          │
│    "payment_link_url": "https://uzanasi.online/pay/abc12345"   │
│  }                                                              │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 6. PAYMENT PAGE - Display Link                                  │
│                                                                 │
│  User visits: https://uzanasi.online/pay/abc12345              │
│                                                                 │
│  Page shows:                                                    │
│  - Amount: 10000 TSh                                            │
│  - QR Code (scannable)                                          │
│  - "Proceed to Payment" button                                  │
│  - Payment methods (M-Pesa, Tigo Pesa)                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. PAYMENT - User Pays                                          │
│                                                                 │
│  User clicks "Proceed to Payment"                               │
│  Redirected to: https://snippe.me/checkout/SN17734359215794741 │
│                                                                 │
│  User enters M-Pesa PIN                                         │
│  Payment processed by Snippe                                    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 8. WEBHOOK - Payment Confirmation                               │
│                                                                 │
│  Snippe sends webhook to:                                       │
│  https://uzanasi.online/functions/v1/snippe-webhook            │
│                                                                 │
│  Webhook updates:                                               │
│  - payment_links.status = "paid"                                │
│  - payment_links.payments_count += 1                            │
│  - payment_links.total_collected += amount                      │
│  - orders.status = "confirmed"                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Key Configuration

### Environment Variables (Supabase Secrets)
```env
SNIPPE_API_KEY=your-snippe-api-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Snippe API Details
- **Endpoint:** `https://api.snippe.sh/v1/payments`
- **Method:** POST
- **Auth:** Bearer token in Authorization header
- **Currency:** TZS (Tanzanian Shilling)
- **Amount:** In cents (10000 = 100 TSh)

### Phone Number Format
- **Input formats accepted:**
  - `+255754000000` (with +)
  - `0754000000` (with 0)
  - `255754000000` (without +)
- **Snippe requires:** `255754000000` (without +)

### Checkout URL Format
- **Correct:** `https://snippe.me/checkout/{reference}`
- **Example:** `https://snippe.me/checkout/SN17734359215794741`
- **Incorrect:** `https://snippe.me/p/{reference}` (returns 404)

## Example: Complete Payment Link Creation

### Input (from checkout form)
```json
{
  "order_id": "550e8400-e29b-41d4-a716-446655440000",
  "buyer_email": "john@example.com",
  "buyer_name": "John Doe",
  "buyer_phone": "+255754000000",
  "amount": 10000
}
```

### Processing
```
1. Generate slug: "abc12345"
2. Format phone: "255754000000"
3. Call Snippe API
4. Get reference: "SN17734359215794741"
5. Save to database
6. Return response
```

### Output (response to frontend)
```json
{
  "success": true,
  "payment_link_id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "abc12345",
  "reference": "SN17734359215794741",
  "payment_link_url": "https://uzanasi.online/pay/abc12345",
  "checkout_url": "https://snippe.me/checkout/SN17734359215794741"
}
```

### Payment Link Page
```
URL: https://uzanasi.online/pay/abc12345

Display:
- Amount: TSh 10,000
- QR Code: [scannable QR]
- Reference: SN17734359215794741
- Recipient: John Doe
- Phone: 255754000000
- Button: "Proceed to Payment"
```

### User Clicks "Proceed to Payment"
```
Redirects to: https://snippe.me/checkout/SN17734359215794741

Snippe checkout page:
- Shows amount: 10,000 TSh
- Shows recipient: John Doe
- User enters M-Pesa PIN
- Payment processed
```

### Payment Confirmation
```
Snippe sends webhook:
POST https://uzanasi.online/functions/v1/snippe-webhook

Body:
{
  "reference": "SN17734359215794741",
  "status": "completed",
  "amount": 10000,
  "currency": "TZS"
}

Database updates:
- payment_links.status = "paid"
- payment_links.payments_count = 1
- payment_links.total_collected = 10000
- orders.status = "confirmed"
```

## Testing Payment Link Creation

### Test 1: Create Payment Link
```bash
# Via checkout form
1. Add product to cart
2. Go to checkout
3. Fill form:
   - Name: "Test User"
   - Email: "test@example.com"
   - Phone: "255754000000"
   - Address: "Test Address"
4. Select "Mobile Money"
5. Click "Place Order"
```

### Test 2: Verify Payment Link
```bash
# Check database
SELECT * FROM payment_links 
WHERE slug = 'abc12345';

# Should return:
# - id: uuid
# - slug: "abc12345"
# - amount: 10000
# - snippe_reference: "SN17734359215794741"
# - status: "active"
# - views: 0
# - payments_count: 0
```

### Test 3: Visit Payment Page
```bash
# Open in browser
https://uzanasi.online/pay/abc12345

# Should display:
# - Amount: TSh 10,000
# - QR Code
# - Reference number
# - "Proceed to Payment" button
```

### Test 4: Verify QR Code
```bash
# Scan QR code with phone
# Should open: https://uzanasi.online/pay/abc12345
```

### Test 5: Test Payment
```bash
# Click "Proceed to Payment"
# Should redirect to: https://snippe.me/checkout/SN17734359215794741
# Snippe checkout page should load
```

## Troubleshooting

### Issue: "Payment Link Not Found"
**Cause:** Slug doesn't exist in database
**Solution:** 
1. Check if payment link was created
2. Verify slug in URL matches database
3. Check database for payment_links table

### Issue: "Invalid phone number"
**Cause:** Phone format is wrong
**Solution:**
1. Use format: `255754000000` (no +)
2. Remove any spaces or dashes
3. Ensure 12 digits total

### Issue: Snippe checkout returns 404
**Cause:** Wrong checkout URL format
**Solution:**
1. Use: `https://snippe.me/checkout/{reference}`
2. Not: `https://snippe.me/p/{reference}`
3. Verify reference is correct

### Issue: Webhook not received
**Cause:** Webhook URL is wrong or Snippe can't reach it
**Solution:**
1. Verify webhook URL is public
2. Check Supabase logs
3. Verify HTTPS is used
4. Check firewall/security settings

## Summary

Payment links are created through:
1. **Frontend** - User submits checkout form
2. **Edge Function** - Calls Snippe API with payment details
3. **Snippe** - Creates payment and returns reference
4. **Database** - Stores payment link with slug and reference
5. **Payment Page** - Displays link with QR code
6. **User** - Scans QR or clicks link to pay
7. **Webhook** - Confirms payment and updates database

The key is that **Snippe creates the actual payment**, and we store the reference in our database for tracking and display.
