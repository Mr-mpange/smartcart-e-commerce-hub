# Reseller Pricing Rules

## 🔒 Core Rule: NO SELLING BELOW VENDOR PRICE

**Resellers CANNOT sell products below the vendor's original price.**

### Pricing Constraints

| Aspect | Rule | Example |
|--------|------|---------|
| **Minimum Price** | Cannot go below vendor price | Vendor: TSh 100,000 → Reseller MIN: TSh 100,000 |
| **Maximum Price** | Unlimited (can markup as much as needed) | Vendor: TSh 100,000 → Reseller can sell at TSh 150,000, TSh 200,000, etc. |
| **Allowed Markup** | Unlimited | Can add any markup percentage |
| **Allowed Discount** | NOT ALLOWED | Cannot sell below vendor price |

## ✅ Valid Pricing Examples

### Example 1: Selling at Vendor Price
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 100,000** ✅
- Markup: **0%**
- Status: **VALID** - Selling at original price

### Example 2: Selling with 10% Markup
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 110,000** ✅
- Markup: **10%**
- Status: **VALID** - Selling with markup

### Example 3: Selling with 50% Markup
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 150,000** ✅
- Markup: **50%**
- Status: **VALID** - Selling with higher markup

### Example 4: Selling with 100% Markup
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 200,000** ✅
- Markup: **100%**
- Status: **VALID** - Unlimited markup allowed

## ❌ Invalid Pricing Examples

### Example 1: Selling Below Vendor Price
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 90,000** ❌
- Discount: **10%**
- Status: **INVALID** - Cannot sell below vendor price

### Example 2: Selling Way Below Vendor Price
- Vendor Price: **TSh 100,000**
- Reseller Price: **TSh 50,000** ❌
- Discount: **50%**
- Status: **INVALID** - Cannot sell below vendor price

## 💰 Commission Structure

Resellers earn commission on their **selling price**:

| Tier | Requirement | Commission Rate |
|------|-------------|-----------------|
| **Bronze** | New resellers | 5% |
| **Silver** | 100K+ sales, 3+ months | 10% |
| **Gold** | 500K+ sales, 6+ months | 15% |
| **Platinum** | 1M+ sales, 12+ months | 20% |

### Commission Calculation

```
Commission = (Reseller Price × Quantity × Commission Rate) / 100
```

**Example 1: Selling at Vendor Price**
- Vendor Price: TSh 100,000
- Reseller Price: TSh 100,000 (0% markup)
- Quantity: 1
- Commission Rate: 10% (Silver tier)
- **Commission Earned: TSh 10,000**

**Example 2: Selling with 20% Markup**
- Vendor Price: TSh 100,000
- Reseller Price: TSh 120,000 (20% markup)
- Quantity: 1
- Commission Rate: 10% (Silver tier)
- **Commission Earned: TSh 12,000** (based on selling price)

**Example 3: Selling with 50% Markup**
- Vendor Price: TSh 100,000
- Reseller Price: TSh 150,000 (50% markup)
- Quantity: 1
- Commission Rate: 10% (Silver tier)
- **Commission Earned: TSh 15,000** (based on selling price)

## 🛡️ Enforcement

### Application Level
- Real-time validation in UI
- Clear error messages for invalid prices
- Prevents form submission if price is below vendor price

### Database Level
- CHECK constraint: `reseller_price >= original_price`
- Prevents invalid data at database level
- Automatic validation on INSERT/UPDATE

### Admin Level
- **NO admin override** - Cannot allow selling below vendor price
- Strict enforcement for all resellers
- Equal pricing rules for all

## 📋 Implementation

### Files Updated
- `src/lib/reseller-pricing.ts` - Validation logic
- `src/components/ResellerProductManagement.tsx` - UI validation
- Database migration: `20260313250000_a1b2c3d4-e5f6-47g8-h9i0-j1k2l3m4n5o6.sql`

### Validation Function
```typescript
validateResellerPrice(
  originalPrice: 100000,
  resellerPrice: 90000,
  maxMarkupPercentage: 0
)
// Returns: { isValid: false, message: "❌ INVALID: Cannot sell below vendor price! Minimum: TSh 100,000" }
```

## 🎯 Benefits

### For Customers
- ✅ Protected from unfair discounts (no dumping)
- ✅ Fair pricing across all resellers
- ✅ Resellers compete on service and quality

### For Vendors
- ✅ Price floor maintained
- ✅ Brand protection
- ✅ Prevents market dumping

### For Resellers
- ✅ Clear, simple rules
- ✅ Unlimited profit potential through markup
- ✅ Fair commission structure
- ✅ Performance-based rewards

### For Platform
- ✅ Trust and credibility
- ✅ Prevents market manipulation
- ✅ Sustainable business model
- ✅ Vendor confidence

## 🚀 How Resellers Earn

Resellers can earn through:

1. **Markup** - Add markup to vendor price and keep the difference
2. **Volume** - Sell more units, earn more commission
3. **Performance Tiers** - Reach higher tiers for better commission rates
4. **Service** - Better customer service, faster delivery, better reviews

## ⚠️ Important Notes

- **No exceptions** - Even admin cannot allow selling below vendor price
- **Strict enforcement** - Both UI and database enforce this
- **Unlimited markup** - Resellers can add any markup they want
- **Fair competition** - All resellers follow same minimum price rule

---

**Last Updated:** March 13, 2026
**Status:** ✅ ACTIVE AND ENFORCED

