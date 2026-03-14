# Top-Up Payment Integration

## Current State (No Real Money)
Currently, the top-up feature is **mock/test only**:
- User enters amount
- Amount is directly added to wallet balance
- No actual payment is processed
- No money changes hands

## Why It's Like This
1. **Development/Testing**: Easier to test without real payments
2. **Payment Provider Integration**: Needs to be connected to a payment provider
3. **Security**: Real payments require proper PCI compliance

## To Make Top-Up Involve Real Money

You need to integrate with a payment provider. Here are the options:

### Option 1: Snippe (Already Integrated)
**Status**: Already integrated for payment links
**How to use for top-up**:
1. Create a payment link for the top-up amount
2. User pays via Snippe
3. Webhook confirms payment
4. Add money to wallet

**Pros**:
- Already integrated in your system
- Supports M-Pesa, Tigo Pesa, Airtel Money
- Webhook system ready

**Cons**:
- Designed for payment links, not direct top-ups

### Option 2: Tembo (Already Integrated)
**Status**: Already integrated for payouts
**How to use for top-up**:
- Tembo is for disbursements (sending money OUT)
- Not suitable for receiving money (top-ups)

### Option 3: Stripe
**Status**: Not integrated
**How to use**:
1. User enters amount
2. Redirects to Stripe checkout
3. User pays with card
4. Webhook confirms payment
5. Add money to wallet

**Pros**:
- Supports international cards
- Secure and reliable
- Good for online payments

**Cons**:
- Requires card (not mobile money)
- Additional setup needed

### Option 4: Pesapal
**Status**: Not integrated
**How to use**:
1. User enters amount
2. Redirects to Pesapal
3. User pays with M-Pesa, Airtel, etc.
4. Webhook confirms payment
5. Add money to wallet

**Pros**:
- Supports mobile money in Tanzania
- Easy integration
- Good for local payments

**Cons**:
- Additional setup needed

## Recommended Solution: Snippe Top-Up

Since you already have Snippe integrated, here's how to implement real money top-ups:

### Step 1: Create Edge Function
```typescript
// supabase/functions/create-topup-link/index.ts
- User requests top-up amount
- Create payment link via Snippe
- Store top-up record in database
- Return payment link to user
```

### Step 2: Create Webhook Handler
```typescript
// supabase/functions/snippe-topup-webhook/index.ts
- Receive payment confirmation from Snippe
- Find top-up record
- Add amount to wallet
- Record transaction
- Send confirmation SMS
```

### Step 3: Update Wallet Page
```typescript
// src/pages/Wallet.tsx
- Instead of direct top-up
- Show "Top Up via Payment Link" button
- Redirect to Snippe payment page
- After payment, money added to wallet
```

### Step 4: Database Changes
```sql
-- Add top_ups table
CREATE TABLE top_ups (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  wallet_id UUID REFERENCES wallets,
  amount NUMERIC,
  status TEXT ('pending', 'completed', 'failed'),
  snippe_reference TEXT,
  created_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

## Implementation Steps

### 1. Create Top-Up Edge Function
```bash
supabase functions new create-topup-link
```

### 2. Update Wallet Component
- Replace direct top-up with payment link
- Show loading state while processing
- Handle payment confirmation

### 3. Add Webhook Handler
- Listen for Snippe payment confirmations
- Update wallet balance
- Send SMS confirmation

### 4. Test
- Create test top-up
- Verify payment link works
- Confirm wallet updated

## Current Workaround
For now, you can:
1. Use the mock top-up for testing
2. Manually add money to wallet via database
3. Or implement one of the payment providers above

## Security Considerations
- Never store payment details
- Use webhooks for confirmation (not redirects)
- Validate all payments server-side
- Log all transactions
- Use HTTPS only
- Implement rate limiting

## Timeline
- **Quick**: 2-3 hours (Snippe integration)
- **Medium**: 4-6 hours (Pesapal integration)
- **Complex**: 8-12 hours (Stripe integration)

## Next Steps
1. Decide which payment provider to use
2. Get API credentials
3. Create edge functions
4. Update UI
5. Test thoroughly
6. Deploy to production
