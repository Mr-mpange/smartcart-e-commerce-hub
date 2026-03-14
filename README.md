# SmartCart - E-Commerce Platform

A modern, full-featured e-commerce platform built with React, TypeScript, and Supabase. SmartCart supports multiple user roles (customers, vendors, resellers, riders, and admins) with integrated payment processing, wallet systems, and comprehensive order management.

## Features

### Core E-Commerce
- **Product Catalog**: Browse products by category with advanced filtering
- **Shopping Cart**: Add/remove items with real-time updates
- **Checkout**: Secure checkout process with payment integration
- **Order Management**: Track orders, view history, and manage returns
- **Product Search**: Fast search with autocomplete suggestions
- **Wishlist**: Save favorite products for later

### Multi-Role System
- **Customers**: Browse, purchase, and track orders
- **Vendors**: Manage products, view sales, and handle orders
- **Resellers**: Buy from vendors and resell with custom pricing
- **Riders**: Manage deliveries and track earnings
- **Admins**: Full platform management and analytics

### Payment System
- **Snippe Integration**: Mobile money payments (Tanzanian market)
- **Payment Links**: Generate shareable payment links
- **Wallet System**: Top-up wallet balance for quick purchases
- **Real-Time Webhooks**: Automatic payment confirmation and settlement
- **Payment Tracking**: Complete payment history and analytics

### Reseller System
- **Product Catalog Management**: Add vendor products to personal catalog
- **Dynamic Pricing**: Set custom prices with flexible markup
- **Sales Tracking**: Monitor reseller sales and commissions
- **Pricing Validation**: Automatic validation of reseller prices
- **Commission Management**: Automatic commission calculation

### Wallet & Payout System
- **Wallet Balance**: Top-up via Stripe, Snippe, or Bank Transfer
- **Stripe Integration**: Instant wallet credit on successful payment
- **Tembo Payouts**: Withdraw earnings via Tembo (B2C mobile money)
- **Bank Transfers**: Manual bank transfer with admin verification
- **Approval Workflow**: Large payouts (≥500,000 TSh) require admin approval
- **Transaction History**: Complete ledger of all transactions
- **Real-Time Updates**: Instant balance updates on payment confirmation
- **Multi-Currency Support**: TZS (Tanzanian Shilling) primary currency

### Payment Methods
- **Stripe**: Credit/debit card payments (instant wallet credit)
- **Mobile Money**: Snippe USSD push (Tanzania)
- **Tembo**: Direct mobile wallet payouts (Tanzania)
- **Bank Transfer**: Manual transfer with admin verification
- **Wallet Balance**: Use existing wallet balance for purchases

### Admin Dashboard
- **User Management**: Manage customers, vendors, resellers, and riders
- **Order Management**: View and manage all orders
- **Revenue Analytics**: Track sales, commissions, and payouts
- **Wallet Management**: Monitor user balances and transactions
- **Payment Monitoring**: Track payment status and disputes
- **Database Cleanup**: Maintenance tools for data management

## Technology Stack

### Frontend
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **React Router** - Client-side routing

### Backend
- **Supabase** - PostgreSQL database and authentication
- **Edge Functions** - Serverless functions for payment processing
- **Row Level Security (RLS)** - Database-level access control
- **Real-Time Subscriptions** - Live updates

### Payment Integration
- **Snippe API** - Mobile money payment gateway
- **Tembo API** - Payout processing
- **Webhooks** - Real-time payment confirmations

## Installation

### Prerequisites
- Node.js 18+ or Bun
- Supabase account
- Snippe API credentials
- Tembo API credentials

### Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd smartcart
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   bun install
   ```

3. **Configure environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your credentials:
   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_SNIPPE_API_KEY=your-snippe-key
   VITE_TEMBO_API_KEY=your-tembo-key
   ```

4. **Set up database**
   ```bash
   npx supabase db push
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5173`

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Navbar.tsx      # Navigation bar
│   ├── ProductCard.tsx # Product display
│   └── ...
├── pages/              # Page components
│   ├── Index.tsx       # Home page
│   ├── Products.tsx    # Product listing
│   ├── Checkout.tsx    # Checkout flow
│   ├── AdminDashboard.tsx
│   ├── VendorDashboard.tsx
│   ├── ResellerDashboard.tsx
│   ├── RiderDashboard.tsx
│   └── ...
├── contexts/           # React contexts
│   └── AuthContext.tsx # Authentication state
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
│   ├── reseller-pricing.ts
│   ├── sms.ts
│   └── utils.ts
├── integrations/       # External service integrations
│   └── supabase/
├── App.tsx             # Main app component
└── main.tsx            # Entry point

supabase/
├── migrations/         # Database migrations
├── functions/          # Edge functions
│   ├── create-payment-link/
│   ├── create-topup-link/
│   ├── snippe-payment/
│   ├── snippe-webhook/
│   ├── snippe-topup-webhook/
│   ├── tembo-payout/
│   └── tembo-webhook/
└── config.toml         # Supabase configuration
```

## Database Schema

### Core Tables
- **auth.users** - User authentication (managed by Supabase)
- **profiles** - User profile information
- **user_roles** - User role assignments
- **products** - Product catalog
- **categories** - Product categories
- **orders** - Customer orders
- **order_items** - Items in orders
- **payment_links** - Payment link records with slug tracking
- **top_ups** - Wallet top-up transactions

### Wallet System
- **wallets** - User wallet balances
- **wallet_transactions** - Transaction history (deposits, withdrawals, payouts)
- **disputes** - Stripe dispute tracking

### Bank Payment System
- **bank_accounts** - User bank account information
- **bank_payments** - Bank transfer payment records
- **bank_payment_verifications** - Admin verification records

### Reseller System
- **reseller_profiles** - Reseller account information
- **reseller_products** - Products in reseller's catalog
- **reseller_sales** - Sales tracking for resellers

### Vendor System
- **vendor_profiles** - Vendor account information
- **vendor_documents** - Vendor verification documents

### Rider System
- **rider_profiles** - Rider account information
- **rider_earnings** - Rider earnings tracking

## Authentication

The app uses Supabase Authentication with email/password and OTP support:

1. **Sign Up**: Create account with email
2. **OTP Verification**: Verify phone number with SMS OTP
3. **Login**: Email and password authentication
4. **Role Assignment**: Automatic role assignment based on registration type
5. **Session Management**: Automatic session handling with refresh tokens

## Wallet Management

### Wallet Functions (src/lib/wallet-management.ts)

```typescript
// Get or create wallet for user
getOrCreateWallet(userId: string): Promise<WalletBalance | null>

// Get wallet balance
getWalletBalance(userId: string): Promise<number | null>

// Add funds from Stripe payment
addFundsFromStripe(
  userId: string,
  amount: number,
  stripePaymentId: string,
  description?: string
): Promise<boolean>

// Deduct funds for payout
deductFundsForPayout(
  userId: string,
  amount: number,
  payoutId: string,
  description?: string
): Promise<{ success: boolean; error?: string }>

// Get transaction history
getTransactionHistory(userId: string, limit?: number): Promise<WalletTransaction[] | null>

// Update transaction status
updateTransactionStatus(
  transactionId: string,
  status: 'pending' | 'completed' | 'failed'
): Promise<boolean>

// Get wallet summary
getWalletSummary(userId: string): Promise<WalletSummary | null>
```

### Usage Example

```typescript
import { getOrCreateWallet, addFundsFromStripe, getWalletBalance } from '@/lib/wallet-management';

// Get or create wallet
const wallet = await getOrCreateWallet(userId);

// Add funds from Stripe
await addFundsFromStripe(userId, 50000, 'pi_stripe_id', 'Top-up via Stripe');

// Get current balance
const balance = await getWalletBalance(userId);

// Get transaction history
const transactions = await getTransactionHistory(userId, 50);
```

## Payment System

### Complete Payment Flow

**Option 1: Stripe Payment**
1. User clicks "Top Up Wallet"
2. Redirected to Stripe payment form
3. Enter card details and complete payment
4. Stripe webhook confirms payment
5. Wallet balance updated automatically
6. User can now withdraw via Tembo

**Option 2: Mobile Money (Snippe)**
1. User initiates payment
2. Edge function creates payment link via Snippe API
3. Payment link stored in database with slug
4. User redirected to Snippe checkout
5. Snippe sends webhook notification
6. Payment status updated in database
7. User wallet or order updated

**Option 3: Bank Transfer**
1. User selects "Bank Transfer" payment method
2. Bank account details displayed
3. User transfers funds to provided account
4. Admin receives notification
5. Admin verifies payment in dashboard
6. Payment marked as verified
7. Order proceeds or wallet credited

**Option 4: Wallet Balance**
1. User has existing wallet balance
2. User selects "Use Wallet Balance"
3. Amount deducted from wallet
4. Transaction recorded
5. Order proceeds immediately

### Payout System

**Payout Flow:**
1. User requests payout
2. Phone number formatted to 255XXXXXXXXX
3. Service code auto-detected based on phone prefix
4. Account number fetched from Tembo API
5. Payout payload constructed with all required fields
6. Request sent to Tembo API with custom headers
7. USSD push sent to recipient
8. Recipient receives funds
9. Transaction recorded in database
10. Wallet balance updated

**Payout Payload Format:**
```json
{
  "countryCode": "TZ",
  "accountNo": "9000123456",
  "serviceCode": "TZ-TIGO-B2C",
  "amount": 50000,
  "msisdn": "255712345678",
  "narration": "Payout Description",
  "currencyCode": "TZS",
  "recipientNames": "Recipient Name",
  "transactionRef": "UNIQUE-REF-ID",
  "transactionDate": "2026-03-14T11:51:53Z",
  "callbackUrl": "https://api.example.com/webhook"
}
```

### Phone Number Format
- Use format: `255XXXXXXXXX` (no `+` prefix)
- Example: `255754000000` for `+255754000000`
- Supported formats: `0XXXXXXXXX`, `XXXXXXXXX`, `255XXXXXXXXX`, `+255XXXXXXXXX`

### Checkout URL
- Format: `https://snippe.me/checkout/{reference}`
- Example: `https://snippe.me/checkout/SN17734359215794741`

### Supported Mobile Providers
- **TIGO**: 255065, 255071 → TZ-TIGO-B2C
- **VODACOM**: 255074, 255075 → TZ-VODACOM-B2C
- **HALOTEL**: 255062 → TZ-HALOTEL-B2C
- **AIRTEL**: Default → TZ-AIRTEL-B2C

## Reseller System

### Pricing Rules
- **Minimum Price**: Cannot sell below vendor's original price
- **Maximum Price**: Unlimited markup allowed
- **Validation**: Automatic price validation on product addition
- **Commission**: Configurable commission rate per reseller

### Reseller Workflow
1. Register as reseller
2. Browse vendor products
3. Add products to personal catalog with custom prices
4. Customers purchase from reseller catalog
5. Reseller earns commission on each sale

### Pricing Validation
```typescript
// Valid: Price >= vendor's original price
reseller_price >= original_price

// Invalid: Price below vendor's original price
reseller_price < original_price
```

## Wallet System

### Top-Up Process
1. User initiates top-up
2. Edge function creates payment link via Snippe
3. User completes payment on Snippe
4. Webhook confirms payment
5. Wallet balance updated automatically

### Payout Process
1. Rider/Reseller requests payout
2. Payout amount checked against balance
3. If ≥500,000 TSh: Requires admin approval
4. If <500,000 TSh: Automatic processing
5. Tembo processes payout
6. Webhook confirms completion
7. Balance deducted from wallet

## Deployment

### Build for Production
```bash
npm run build
```

Output is in the `dist/` directory.

### Deploy to Hostinger (Shared Hosting)

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Upload files**
   - Upload contents of `dist/` to `public_html/`
   - Upload `.htaccess` file to `public_html/` root

3. **Configure domain**
   - Point domain to `public_html/` directory
   - Ensure `.htaccess` is in place for React Router routing

4. **Environment variables**
   - Update `.env` with production Supabase credentials
   - Rebuild and redeploy

### .htaccess Configuration
The `.htaccess` file enables client-side routing for React Router:
```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule . /index.html [L]
</IfModule>
```

## API Endpoints

### Payment Links
- `POST /functions/v1/create-payment-link` - Create payment link
- `POST /functions/v1/create-topup-link` - Create top-up link
- `POST /functions/v1/snippe-webhook` - Payment confirmation webhook
- `POST /functions/v1/snippe-topup-webhook` - Top-up confirmation webhook

### Payouts
- `POST /functions/v1/tembo-payout` - Request payout (send, bulk, approve, reject)
- `POST /functions/v1/tembo-webhook` - Payout confirmation webhook

### Stripe Integration
- `POST /functions/v1/stripe-webhook` - Stripe payment webhook
  - Handles: `payment_intent.succeeded`, `charge.refunded`, `charge.dispute.created`

### Wallet Operations
- `GET /rest/v1/wallets` - Get user wallet
- `GET /rest/v1/wallet_transactions` - Get transaction history
- `POST /rest/v1/wallet_transactions` - Record transaction

### Bank Payments
- `GET /rest/v1/bank_accounts` - Get user bank accounts
- `POST /rest/v1/bank_accounts` - Add bank account
- `GET /rest/v1/bank_payments` - Get bank payment history
- `POST /rest/v1/bank_payments` - Create bank payment
- `POST /rest/v1/bank_payment_verifications` - Verify bank payment (admin)

## Browser Cache Issues

If you see outdated messages or pricing validation errors:

1. **Hard Refresh**: Press `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. **Clear Cache**: Open DevTools → Application → Clear Storage
3. **Incognito Mode**: Test in private/incognito window

## Troubleshooting

### Payment Links Return 404
- Verify payment link exists in database
- Check RLS policies on `payment_links` table
- Ensure Snippe API credentials are correct
- Verify phone number format (no `+` prefix)

### Reseller Pricing Shows "Exceeds Limit"
- Hard refresh browser (Ctrl+Shift+R)
- Clear browser cache
- Verify pricing validation logic in `src/lib/reseller-pricing.ts`

### Wallet Balance Not Updating
- Check webhook logs in Supabase
- Verify payment status in Snippe dashboard
- Check RLS policies on `top_ups` table
- Ensure user is authenticated

### Orders Not Appearing
- Verify user role is set correctly
- Check RLS policies on `orders` table
- Ensure order items are linked correctly
- Check browser console for errors

## Development

### Running Tests
```bash
npm run test
```

### Linting
```bash
npm run lint
```

### Type Checking
```bash
npm run type-check
```

## Environment Variables

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_SUPABASE_PROJECT_ID=your-project-id
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key

# Payment Gateway - Snippe
SNIPPE_API_KEY=your-snippe-key

# Payout Gateway - Tembo
TEMBO_ACCOUNT_ID=your-tembo-account-id
TEMBO_SECRET=your-tembo-secret
TEMBO_API_URL=https://api.temboplus.com/tembo/v1

# Stripe (for wallet top-ups)
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Application
VITE_APP_URL=https://uzanasi.online
```

### Supabase Secrets (Set in Supabase Dashboard)
```
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_SECRET_KEY=sk_test_...
TEMBO_ACCOUNT_ID=your-tembo-account-id
TEMBO_SECRET=your-tembo-secret
SNIPPE_API_KEY=your-snippe-key
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review recent documentation files
3. Check browser console for errors
4. Review Supabase logs for backend issues

## Deployment

### Production Build
```bash
npm run build
```

### Deploy to Vercel
```bash
vercel deploy --prod
```

### Deploy to Hostinger
1. Build the app: `npm run build`
2. Upload `dist/` contents to `public_html/`
3. Upload `.htaccess` file for React Router routing
4. Update environment variables in Supabase

### Edge Functions Deployment
```bash
npx supabase functions deploy stripe-webhook
npx supabase functions deploy tembo-payout
npx supabase functions deploy tembo-payment
npx supabase functions deploy create-payment-link
# ... deploy all other functions
```

### Database Migrations
```bash
npx supabase db push
```

## System Status

**Current Version:** 1.0.0  
**Status:** ✅ Production Ready  
**Last Updated:** March 14, 2026

### Deployed Components
- ✅ Frontend (React + TypeScript)
- ✅ Backend (Supabase + Edge Functions)
- ✅ Database (PostgreSQL with RLS)
- ✅ Payment System (Snippe + Tembo + Stripe)
- ✅ Wallet System (Deposits, Withdrawals, Payouts)
- ✅ Bank Payment System (Manual verification)
- ✅ Reseller System (Dynamic pricing)
- ✅ Admin Dashboard (Full management)

## License

Proprietary - All rights reserved

## Contributors

SmartCart Development Team
