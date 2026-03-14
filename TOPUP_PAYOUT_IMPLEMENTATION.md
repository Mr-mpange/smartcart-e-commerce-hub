# Top-Up and Payout Implementation Complete

## What Was Implemented

### 1. **Real Money Top-Up** (via Snippe)
Users can now add real money to their wallet through mobile money payments.

**Flow**:
1. User clicks "Top Up" in wallet
2. Enters amount
3. Clicks "Add" button
4. Redirected to Snippe payment page
5. User pays via M-Pesa, Tigo Pesa, or Airtel Money
6. Payment confirmed via webhook
7. Money added to wallet
8. SMS confirmation sent

**Files Created**:
- `supabase/functions/create-topup-link/index.ts` - Creates payment link
- `supabase/functions/snippe-topup-webhook/index.ts` - Handles payment confirmation
- `supabase/migrations/20260313210000_create_top_ups_table.sql` - Database table

**Files Updated**:
- `src/pages/Wallet.tsx` - Real payment integration
- `src/pages/RiderDashboard.tsx` - Real payment integration
- `src/pages/ResellerDashboard.tsx` - Real payment integration

### 2. **Payout System** (Already Implemented via Tembo)
Users can withdraw money from wallet to mobile money accounts.

**Flow**:
1. User clicks "Withdraw" in wallet
2. Enters amount and phone number
3. Clicks "Withdraw" button
4. If amount ≥ 500,000 TZS: Requires admin approval
5. If amount < 500,000 TZS: Processes immediately
6. Tembo sends money to phone
7. Webhook confirms payment
8. SMS confirmation sent
9. If failed: Money refunded to wallet

**Already Implemented**:
- `supabase/functions/tembo-payout/index.ts` - Handles payouts
- `supabase/functions/tembo-webhook/index.ts` - Handles confirmations
- `payouts` table - Tracks all payouts

## Database Tables

### top_ups
```sql
- id (UUID) - Unique identifier
- user_id (UUID) - User requesting top-up
- amount (NUMERIC) - Amount in TZS
- status (TEXT) - 'pending', 'completed', 'failed'
- snippe_reference (TEXT) - Reference from Snippe
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

### payouts (Already exists)
```sql
- id (UUID)
- requested_by (UUID)
- recipient_phone (TEXT)
- amount (NUMERIC)
- status (TEXT) - 'pending_approval', 'processing', 'completed', 'failed'
- tembo_reference (TEXT)
- approval_required (BOOLEAN)
```

## Setup Instructions

### 1. Apply Database Migration
Run in Supabase SQL Editor:
```sql
-- Create top_ups table for tracking wallet top-up payments
CREATE TABLE public.top_ups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  snippe_reference TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb
);

ALTER TABLE public.top_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own top-ups"
ON public.top_ups
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create top-ups"
ON public.top_ups
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all top-ups"
ON public.top_ups
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() 
  AND role = 'admin'
));

CREATE INDEX idx_top_ups_user_id ON public.top_ups(user_id);
CREATE INDEX idx_top_ups_status ON public.top_ups(status);
CREATE INDEX idx_top_ups_snippe_reference ON public.top_ups(snippe_reference);
CREATE INDEX idx_top_ups_created_at ON public.top_ups(created_at);

ALTER PUBLICATION supabase_realtime ADD TABLE public.top_ups;
```

### 2. Deploy Edge Functions
```bash
supabase functions deploy create-topup-link
supabase functions deploy snippe-topup-webhook
```

### 3. Configure Webhooks in Snippe Dashboard
- Add webhook URL: `https://[project].supabase.co/functions/v1/snippe-topup-webhook`
- Events: Payment completed, Payment failed

### 4. Verify Environment Variables
Ensure these are set in Supabase:
- `SNIPPE_API_KEY` - For top-ups
- `TEMBO_API_KEY` - For payouts
- `BRIQ_API_KEY` - For SMS (optional)

## How It Works

### Top-Up Flow
```
User → Wallet Page → Click "Top Up"
  ↓
Enter Amount → Click "Add"
  ↓
create-topup-link Edge Function
  - Creates top_ups record
  - Calls Snippe API
  - Returns payment link
  ↓
User Redirected to Snippe Payment Page
  ↓
User Pays via M-Pesa/Tigo/Airtel
  ↓
Snippe Sends Webhook
  ↓
snippe-topup-webhook Edge Function
  - Finds top_ups record
  - Adds money to wallet
  - Records transaction
  - Sends SMS
  ↓
User Sees Success Message
```

### Payout Flow
```
User → Wallet Page → Click "Withdraw"
  ↓
Enter Amount & Phone → Click "Withdraw"
  ↓
tembo-payout Edge Function
  - Creates payouts record
  - If ≥ 500K: Requires admin approval
  - If < 500K: Processes immediately
  ↓
Tembo Sends Money to Phone
  ↓
Tembo Sends Webhook
  ↓
tembo-webhook Edge Function
  - Updates payout status
  - Records transaction
  - Sends SMS
  ↓
User Sees Success Message
```

## Testing

### Test Top-Up
1. Go to Wallet page
2. Click "Top Up"
3. Enter amount (e.g., 10,000)
4. Click "Add TSh 10,000"
5. You'll be redirected to Snippe payment page
6. Use test credentials to complete payment
7. Wallet should update automatically

### Test Payout
1. Go to Wallet page
2. Click "Withdraw"
3. Enter amount and phone number
4. Click "Withdraw"
5. If amount < 500K: Processes immediately
6. If amount ≥ 500K: Admin must approve
7. Money sent to phone via Tembo

## Approval Threshold
- **< 500,000 TZS**: Automatic processing
- **≥ 500,000 TZS**: Requires admin approval

## Security Features
- RLS policies on all tables
- User can only see their own transactions
- Admin approval for large payouts
- Webhook verification
- SMS confirmation
- Automatic refunds on failed payouts
- Ledger audit trail

## Troubleshooting

### Top-Up Not Working
1. Check SNIPPE_API_KEY is set
2. Verify webhook URL in Snippe dashboard
3. Check browser console for errors
4. Check Supabase function logs

### Payout Not Working
1. Check TEMBO_API_KEY is set
2. Verify wallet has sufficient balance
3. Check phone number format
4. Check Supabase function logs

### Webhook Not Triggering
1. Verify webhook URL is correct
2. Check Snippe/Tembo dashboard settings
3. Check Supabase function logs
4. Verify CORS headers

## Next Steps
1. Apply database migration
2. Deploy edge functions
3. Configure webhooks
4. Test top-up and payout
5. Deploy to production
6. Monitor transactions

## Support
For issues, check:
- Supabase function logs
- Browser console
- Database records
- Snippe/Tembo dashboards
