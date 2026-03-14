# Wallet and Payout System Architecture

## Overview
The wallet and payout system is controlled by **Tembo** (a payment disbursement service). Here's how it works:

## System Components

### 1. **Wallet System** (Internal)
- **Table**: `wallets`
- **Purpose**: Store user money balances
- **Features**:
  - Top-up wallet (add money)
  - Track balance
  - Record transactions in `wallet_transactions`

### 2. **Payout System** (Tembo-Controlled)
- **Table**: `payouts`
- **Purpose**: Send money from wallet to mobile money accounts
- **Provider**: Tembo (Sandbox: https://sandbox.temboplus.com)
- **Features**:
  - Single payouts
  - Bulk payouts
  - Approval workflow for large amounts (≥500,000 TZS)

### 3. **Ledger System** (Audit Trail)
- **Table**: `ledger_entries`
- **Purpose**: Track all financial transactions
- **Records**: Payouts, commissions, refunds, etc.

## Payout Flow

### Step 1: User Requests Payout
```
User → Wallet → Requests Payout
  - Amount
  - Phone Number
  - Description
```

### Step 2: Payout Created
```
Edge Function: tembo-payout (action: 'send')
  - Creates payout record in database
  - Status: 'pending_approval' (if ≥500,000 TZS)
  - Status: 'processing' (if <500,000 TZS)
```

### Step 3: Approval (if needed)
```
Admin → Approves/Rejects Payout
  - If approved: Status → 'processing'
  - If rejected: Status → 'rejected', Money refunded to wallet
```

### Step 4: Tembo Processes Payment
```
Edge Function: tembo-payout (processTemboPayment)
  - Calls Tembo API: POST /v1/disbursements
  - Sends money to phone number
  - Deducts from wallet
  - Records transaction
```

### Step 5: Webhook Confirmation
```
Tembo → Webhook → Edge Function: tembo-webhook
  - Receives payment status
  - Updates payout status: 'completed' or 'failed'
  - If failed: Refunds money to wallet
  - Sends SMS confirmation
```

## Database Tables

### wallets
```sql
- id (UUID)
- user_id (UUID) - References auth.users
- balance (NUMERIC) - Current balance in TZS
- currency (TEXT) - Default: 'TZS'
```

### wallet_transactions
```sql
- id (UUID)
- wallet_id (UUID)
- type (TEXT) - 'top_up', 'withdrawal', 'commission', 'refund'
- amount (NUMERIC)
- description (TEXT)
- created_at (TIMESTAMP)
```

### payouts
```sql
- id (UUID)
- requested_by (UUID) - User requesting payout
- recipient_phone (TEXT)
- recipient_name (TEXT)
- amount (NUMERIC)
- status (TEXT) - 'pending_approval', 'processing', 'completed', 'failed', 'rejected'
- tembo_reference (TEXT) - Reference from Tembo API
- approval_required (BOOLEAN)
- approved_by (UUID) - Admin who approved
- approved_at (TIMESTAMP)
- rejected_by (UUID) - Admin who rejected
- rejected_at (TIMESTAMP)
- rejection_reason (TEXT)
- wallet_id (UUID) - Optional: wallet to deduct from
- metadata (JSONB) - Error details if failed
```

### ledger_entries
```sql
- id (UUID)
- transaction_type (TEXT) - 'payout', 'commission', 'refund'
- amount (NUMERIC)
- sender_name (TEXT)
- sender_id (UUID)
- receiver_name (TEXT)
- receiver_id (UUID)
- reference (TEXT)
- reference_id (UUID)
- status (TEXT) - 'completed', 'failed'
- description (TEXT)
```

## Edge Functions

### 1. tembo-payout
**Location**: `supabase/functions/tembo-payout/index.ts`

**Actions**:
- `send` - Single payout
- `bulk` - Multiple payouts
- `approve` - Admin approves pending payout
- `reject` - Admin rejects pending payout

**Environment Variables**:
- `TEMBO_API_KEY` - Tembo API key
- `BRIQ_API_KEY` - SMS service (optional)

### 2. tembo-webhook
**Location**: `supabase/functions/tembo-webhook/index.ts`

**Purpose**: Receives payment status from Tembo
**Triggers**: When Tembo completes/fails a disbursement
**Actions**:
- Updates payout status
- Refunds wallet if failed
- Sends SMS confirmation

## Approval Threshold
- **Amount ≥ 500,000 TZS**: Requires admin approval
- **Amount < 500,000 TZS**: Processes immediately

## All Roles Have Wallet
- **Rider**: Collect COD payments, store in wallet
- **Reseller**: Earn commissions, store in wallet
- **Vendor**: Earn from sales, store in wallet
- **Admin**: Manage platform finances

## Payout Process for Each Role

### Rider
1. Collects cash from customers (COD)
2. Tops up wallet with collected amount
3. Requests payout to mobile money
4. Tembo sends money to phone

### Reseller
1. Earns commission from sales
2. Commission added to wallet
3. Requests payout to mobile money
4. Tembo sends money to phone

### Vendor
1. Earns from product sales
2. Money held in escrow initially
3. Released to wallet after delivery
4. Requests payout to mobile money
5. Tembo sends money to phone

## Security Features
- RLS policies on all tables
- Admin approval for large payouts
- Webhook verification from Tembo
- SMS confirmation to recipient
- Ledger audit trail
- Automatic refunds on failed payouts

## Testing
- Use Tembo Sandbox: https://sandbox.temboplus.com
- Test phone numbers: +255754000000 (M-Pesa), +255655000000 (Tigo)
- Approval threshold: 500,000 TZS

## Configuration Needed
1. Set `TEMBO_API_KEY` in Supabase environment
2. Set `BRIQ_API_KEY` for SMS (optional)
3. Configure Tembo webhook URL in Tembo dashboard
4. Webhook URL: `https://[project].supabase.co/functions/v1/tembo-webhook`
