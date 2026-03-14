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

### Wallet & Payout
- **Wallet Balance**: Top-up via Snippe mobile money
- **Payout System**: Withdraw earnings via Tembo (bulk payouts)
- **Approval Workflow**: Large payouts (≥500,000 TSh) require admin approval
- **Transaction History**: Complete ledger of all transactions
- **Real-Time Updates**: Instant balance updates on payment confirmation

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
- **payment_links** - Payment link records
- **top_ups** - Wallet top-up transactions

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

## Payment System

### Payment Flow

1. **Create Payment Link**
   - User initiates payment
   - Edge function creates payment link via Snippe API
   - Payment link stored in database
   - User redirected to Snippe checkout

2. **Payment Confirmation**
   - Snippe sends webhook notification
   - Edge function processes webhook
   - Payment status updated in database
   - User wallet or order updated

3. **Payment Verification**
   - Payment status checked via Snippe API
   - Automatic settlement after confirmation
   - Transaction recorded in ledger

### Phone Number Format
- Use format: `255XXXXXXXXX` (no `+` prefix)
- Example: `255754000000` for `+255754000000`

### Checkout URL
- Format: `https://snippe.me/checkout/{reference}`
- Example: `https://snippe.me/checkout/SN17734359215794741`

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
- `POST /functions/v1/tembo-payout` - Request payout
- `POST /functions/v1/tembo-webhook` - Payout confirmation webhook

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

# Payment Gateway
VITE_SNIPPE_API_KEY=your-snippe-key
VITE_SNIPPE_API_URL=https://api.snippe.me

# Payout Gateway
VITE_TEMBO_API_KEY=your-tembo-key
VITE_TEMBO_API_URL=https://api.tembo.io

# Application
VITE_APP_URL=https://uzanasi.online
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review recent documentation files
3. Check browser console for errors
4. Review Supabase logs for backend issues

## License

Proprietary - All rights reserved

## Contributors

SmartCart Development Team
