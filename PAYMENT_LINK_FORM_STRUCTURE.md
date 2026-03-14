# Payment Link Form Structure & Implementation

## Current Implementation Overview

Your SmartCart payment system has a well-designed form structure for creating and displaying payment links. Here's how it works:

## 1. Payment Link Creation Flow

### Entry Point: Checkout Page (`src/pages/Checkout.tsx`)

The checkout form collects customer information:

```
Customer Information Form
├── Full Name (required)
├── Email Address (required)
├── Phone Number (required)
│   └── Format: +255 XXX XXX XXX
│   └── Used for payment request delivery
├── Delivery Address (required)
└── Payment Method (radio selection)
    ├── Mobile Money (default)
    └── Cash on Delivery
```

### Form Data Structure
```typescript
{
  name: string;           // Customer full name
  email: string;          // Customer email
  phone: string;          // Phone number for payment request
  address: string;        // Delivery address
  paymentMethod: string;  // "mobile_money" or "cash_on_delivery"
}
```

## 2. Payment Link Creation Process

### Step 1: Order Creation
When user submits checkout form:
1. Order created in database with status "pending"
2. Order items linked to order
3. Escrow entries created per vendor

### Step 2: Payment Link Generation
For mobile money payments, edge function `create-payment-link` is called:

**Request Payload:**
```typescript
{
  order_id: string;           // Order ID from database
  buyer_email: string;        // Customer email
  buyer_name: string;         // Customer name
  buyer_phone: string;        // Phone number (format: 255XXXXXXXXX)
  amount: number;             // Total amount in TSh
}
```

**Response:**
```typescript
{
  success: boolean;
  payment_link_id: string;    // UUID for the payment link
  reference: string;          // Snippe reference (e.g., SN17734359215794741)
  payment_link: string;       // Shareable link (https://uzanasi.online/pay/{linkId})
  checkout_url: string;       // Snippe checkout URL
}
```

## 3. Payment Link Display Page (`src/pages/PaymentPage.tsx`)

### URL Format
```
https://uzanasi.online/pay/{linkId}
```

### Displayed Information
```
Payment Request Page
├── Payment Amount (large, prominent)
│   └── TSh {amount}
├── Description (if provided)
├── Recipient Information
│   ├── Recipient Name
│   └── Recipient Phone
├── Reference Number
│   └── Snippe reference or link ID
├── Payment Status Badge
│   ├── Active (green)
│   ├── Paid (blue)
│   └── Expired (red)
├── Payment Methods Info
│   ├── M-Pesa
│   └── Tigo Pesa
└── Metadata
    ├── Created Date
    └── Expiration Date (if set)
```

## 4. Database Schema

### payment_links Table
```sql
CREATE TABLE payment_links (
  id uuid PRIMARY KEY,
  amount decimal(12,2) NOT NULL,
  description text,
  status text DEFAULT 'active',
  checkout_url text,
  snippe_reference text,
  recipient_name text,
  recipient_phone text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp,
  expires_at timestamp,
  paid_at timestamp
);
```

## 5. Key Features

### Phone Number Handling
- **Input Format**: Accepts +255XXXXXXXXX or 0XXXXXXXXX
- **Storage Format**: 255XXXXXXXXX (no + prefix)
- **Snippe API Format**: 255XXXXXXXXX (required by Snippe)

### Mobile Money Provider Detection
Automatically detects provider based on phone prefix:
- **Vodacom M-Pesa**: 74, 75, 76
- **Airtel Money**: 71, 65, 67, 68
- **Tigo Pesa**: 77, 78
- **Halotel**: 62, 69

### Payment Flow
1. User fills checkout form
2. Order created in database
3. Payment link generated via Snippe API
4. User redirected to payment confirmation page
5. Payment request sent to user's phone
6. User enters mobile money PIN
7. Webhook confirms payment
8. Order status updated to "confirmed"
9. Escrow released to vendor

## 6. Snippe Integration

### API Endpoint
```
POST https://api.snippe.sh/v1/payments
```

### Request Headers
```
Authorization: Bearer {SNIPPE_API_KEY}
Content-Type: application/json
Idempotency-Key: link-{linkId}
```

### Request Payload
```json
{
  "payment_type": "mobile",
  "details": {
    "amount": 10000,
    "currency": "TZS"
  },
  "phone_number": "255754000000",
  "customer": {
    "firstname": "John",
    "lastname": "Doe",
    "email": "john@example.com"
  },
  "webhook_url": "https://uzanasi.online/functions/v1/snippe-webhook",
  "redirect_url": "https://uzanasi.online/pay/{linkId}",
  "metadata": {
    "payment_link_id": "{linkId}",
    "order_id": "{orderId}",
    "created_by": "{userId}",
    "is_shareable_link": true
  }
}
```

### Response
```json
{
  "data": {
    "reference": "SN17734359215794741",
    "status": "pending",
    "amount": 10000,
    "currency": "TZS"
  }
}
```

## 7. Checkout URL Format

### Correct Format
```
https://snippe.me/checkout/{reference}
```

### Example
```
https://snippe.me/checkout/SN17734359215794741
```

## 8. Form Validation

### Required Fields
- ✅ Full Name (non-empty)
- ✅ Email (valid email format)
- ✅ Phone Number (non-empty)
- ✅ Delivery Address (non-empty)
- ✅ Cart Items (at least one item)

### Phone Number Validation
- Accepts: +255XXXXXXXXX, 0XXXXXXXXX, 255XXXXXXXXX
- Converts to: 255XXXXXXXXX for API calls
- Validates: Must be valid Tanzanian number

## 9. Error Handling

### Common Errors & Solutions

| Error | Cause | Solution |
|-------|-------|----------|
| "Payment Link Not Found" | Link ID doesn't exist in DB | Check link ID in URL |
| "HTTP 404" on Snippe checkout | Wrong reference format | Verify Snippe reference format |
| "Invalid phone number" | Wrong format or invalid number | Use 255XXXXXXXXX format |
| "Payment service not configured" | Missing SNIPPE_API_KEY | Add API key to Supabase secrets |
| "Unauthorized" | User not authenticated | Ensure user is logged in |

## 10. Best Practices

### For Payment Link Creation
1. Always validate phone number format before sending to Snippe
2. Store both our link ID and Snippe reference for tracking
3. Include metadata for webhook processing
4. Set appropriate expiration times for links
5. Log all payment attempts for debugging

### For Payment Link Display
1. Show clear payment status (Active, Paid, Expired)
2. Display recipient information for verification
3. Show payment methods available
4. Include reference number for customer support
5. Provide clear error messages

### For Security
1. Disable RLS on payment_links table for public access
2. Validate all input before sending to Snippe
3. Verify webhook signatures from Snippe
4. Store sensitive data securely
5. Use HTTPS for all payment URLs

## 11. Improvements Made

✅ **Phone Number Format**: Fixed from +255 to 255 (no + prefix)
✅ **Checkout URL**: Fixed from /p/ to /checkout/ endpoint
✅ **RLS Policies**: Disabled on payment_links for public access
✅ **Error Messages**: Improved error handling and user feedback
✅ **Payment Status**: Added status tracking (active, paid, expired)
✅ **Metadata**: Added comprehensive metadata for tracking

## 12. Testing Payment Links

### Create Test Payment Link
```bash
# Via Checkout
1. Add product to cart
2. Go to checkout
3. Fill form with test data
4. Select Mobile Money
5. Submit form
```

### Verify Payment Link
```bash
# Check database
SELECT * FROM payment_links WHERE id = '{linkId}';

# Check Snippe API
curl -H "Authorization: Bearer {SNIPPE_API_KEY}" \
  https://api.snippe.sh/v1/payments/{reference}
```

### Test Payment Flow
1. Create payment link
2. Visit payment page: https://uzanasi.online/pay/{linkId}
3. Verify all information displays correctly
4. Check Snippe checkout URL is accessible
5. Verify webhook receives payment confirmation

## 13. Configuration

### Environment Variables
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SNIPPE_API_KEY=your-snippe-key
```

### Supabase Secrets (for edge functions)
```
SNIPPE_API_KEY=your-snippe-key
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Summary

Your payment link system is well-structured with:
- ✅ Clear form structure for collecting payment information
- ✅ Proper phone number formatting and validation
- ✅ Correct Snippe API integration
- ✅ Shareable payment links with unique IDs
- ✅ Comprehensive payment status tracking
- ✅ Proper error handling and user feedback
- ✅ Secure webhook processing

The implementation follows best practices for e-commerce payment systems and provides a smooth user experience for both payers and recipients.
