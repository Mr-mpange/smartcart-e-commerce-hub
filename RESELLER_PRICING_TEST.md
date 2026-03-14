# Reseller Product Pricing - Test Guide

## Rule
**Reseller can sell at vendor price or HIGHER (no selling below vendor price)**

## Test Scenario
Product: **Abaya**
Vendor Price: **TSh 1,000**

## Test Cases

### Test 1: Selling at Vendor Price (TSh 1,000)
**Input:** 1000
**Expected:** ✅ VALID
**Display:**
- Icon: ✓ Green checkmark
- Message: "Valid price (0.0% markup)"
- Button: "Add Product" enabled

### Test 2: Selling Above Vendor Price (TSh 1,500)
**Input:** 1500
**Expected:** ✅ VALID
**Display:**
- Icon: ✓ Green checkmark
- Message: "Valid price (50.0% markup)"
- Button: "Add Product" enabled

### Test 3: Selling Above Vendor Price (TSh 2,000)
**Input:** 2000
**Expected:** ✅ VALID
**Display:**
- Icon: ✓ Green checkmark
- Message: "Valid price (100.0% markup)"
- Button: "Add Product" enabled

### Test 4: Selling Below Vendor Price (TSh 999)
**Input:** 999
**Expected:** ❌ INVALID
**Display:**
- Icon: ✗ Red alert triangle
- Message: "❌ INVALID: Cannot sell below vendor price! Minimum: TSh 1,000"
- Button: "Add Product" disabled (if clicked, shows error toast)

### Test 5: Selling Below Vendor Price (TSh 500)
**Input:** 500
**Expected:** ❌ INVALID
**Display:**
- Icon: ✗ Red alert triangle
- Message: "❌ INVALID: Cannot sell below vendor price! Minimum: TSh 1,000"
- Button: "Add Product" disabled (if clicked, shows error toast)

## How to Test

1. Go to Reseller Dashboard
2. Click "Add Product" button
3. Select "Abaya - TSh 1,000" from dropdown
4. Enter price in "Your Selling Price (TSh)" field
5. Watch the validation message update in real-time
6. Try each test case above

## Expected Behavior

### Real-time Validation (as you type)
- ✅ Green checkmark appears when price >= 1,000
- ❌ Red alert appears when price < 1,000
- Message updates to show markup percentage or error

### On Add Product Click
- ✅ If valid: Product added to catalog, dialog closes, success toast shown
- ❌ If invalid: Error toast shown, dialog stays open

## Validation Logic

```typescript
// Minimum allowed price = Vendor price
minAllowedPrice = 1000

// Valid if reseller price >= vendor price
isValid = resellerPrice >= minAllowedPrice

// Examples:
1000 >= 1000 = true  ✅
1500 >= 1000 = true  ✅
999 >= 1000 = false  ❌
500 >= 1000 = false  ❌
```

## Files Involved

- `src/components/ResellerProductManagement.tsx` - Component with Add Product dialog
- `src/lib/reseller-pricing.ts` - Validation function
- `src/pages/ResellerDashboard.tsx` - Dashboard page

## Status: ✅ READY FOR TESTING

All code is in place and should work as described above.
