# Reseller Pricing Control System

## 🎯 **Problem Solved**
Ensures resellers cannot sell products above the vendor's original price, preventing price manipulation and maintaining fair pricing across the platform.

## 🔒 **Price Control Mechanisms**

### 1. **Database-Level Constraints**
```sql
-- Constraint in reseller_products table
CONSTRAINT valid_reseller_price CHECK (
    reseller_price <= original_price * (1 + (markup_percentage / 100))
)
```

### 2. **Application-Level Validation**
- Real-time price validation in UI
- Server-side validation functions
- Automatic price limit calculations

### 3. **Admin-Controlled Markup Limits**
- Default: 0% markup (cannot increase price)
- Admin can set custom markup limits per reseller
- Maximum markup percentage stored in `reseller_profiles.max_markup_percentage`

## 📊 **How It Works**

### **For Resellers:**
1. **Browse Products**: View all available products with original vendor prices
2. **Set Prices**: Can only set prices within allowed markup limit
3. **Real-time Validation**: Immediate feedback if price exceeds limits
4. **Commission Calculation**: Earn commission based on their selling price

### **For Admins:**
1. **Set Markup Limits**: Control maximum markup percentage per reseller
2. **Monitor Pricing**: View all reseller prices vs original prices
3. **Approve Resellers**: Only approved resellers can add products

### **For Customers:**
1. **Fair Pricing**: Protected from inflated reseller prices
2. **Price Transparency**: Can see original vendor prices
3. **Best Deals**: Resellers compete on service, not inflated prices

## 🛡️ **Security Features**

### **Database Security:**
- Row Level Security (RLS) policies
- Check constraints prevent invalid prices
- Audit trail for all price changes

### **Application Security:**
- Client-side validation for UX
- Server-side validation for security
- Price validation utilities

### **Business Logic:**
- Cannot exceed vendor price + allowed markup
- Cannot sell below 50% of original price (prevents dumping)
- Commission calculated on reseller price, not markup

## 📈 **Commission Structure**

### **Tiered Commission Rates:**
- **Bronze (New)**: 5% commission
- **Silver (Regular)**: 10% commission  
- **Gold (Performer)**: 15% commission
- **Platinum (Premium)**: 20% commission

### **Commission Calculation:**
```typescript
commission = (reseller_price × quantity × commission_rate) / 100
```

## 🔧 **Implementation Details**

### **Database Tables:**
1. **`reseller_profiles`**: Stores markup limits and commission rates
2. **`reseller_products`**: Tracks reseller-specific pricing
3. **`reseller_sales`**: Records sales and commission history

### **Key Functions:**
1. **`validate_reseller_price()`**: Database function for price validation
2. **`validateResellerPrice()`**: TypeScript utility for client validation
3. **`calculateCommission()`**: Commission calculation utility

### **UI Components:**
1. **`ResellerProductManagement`**: Product catalog management
2. **Price validation indicators**: Real-time feedback
3. **Commission tracking**: Performance dashboard

## 🚀 **Benefits**

### **For the Platform:**
- ✅ Prevents price manipulation
- ✅ Maintains vendor trust
- ✅ Ensures fair competition
- ✅ Protects customer experience

### **For Vendors:**
- ✅ Price integrity maintained
- ✅ Brand protection
- ✅ Increased distribution without risk

### **For Resellers:**
- ✅ Clear pricing guidelines
- ✅ Fair commission structure
- ✅ Performance-based rewards
- ✅ Easy product management

### **For Customers:**
- ✅ Protected from price inflation
- ✅ Consistent pricing experience
- ✅ Access to more sellers
- ✅ Better service competition

## 📋 **Usage Examples**

### **Example 1: Valid Pricing**
- Vendor Price: TSh 100,000
- Max Markup: 0%
- Reseller Price: TSh 100,000 ✅
- Commission (10%): TSh 10,000

### **Example 2: Invalid Pricing**
- Vendor Price: TSh 100,000
- Max Markup: 0%
- Reseller Price: TSh 120,000 ❌
- Error: "Price exceeds limit! Max: TSh 100,000"

### **Example 3: Discount Pricing**
- Vendor Price: TSh 100,000
- Max Markup: 0%
- Reseller Price: TSh 90,000 ✅
- Commission (10%): TSh 9,000

## 🔄 **Migration Path**

1. **Apply Database Migration**: Creates tables and constraints
2. **Enable Price Controls**: Automatic validation starts
3. **Admin Configuration**: Set markup limits per reseller
4. **Reseller Onboarding**: Existing resellers migrate to new system
5. **Monitoring**: Track pricing compliance and performance

This system ensures **fair pricing**, **vendor protection**, and **customer trust** while allowing resellers to earn commissions through better service and marketing, not price manipulation.