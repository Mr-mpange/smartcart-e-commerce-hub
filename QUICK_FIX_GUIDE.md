# Quick Fix Guide

## Two Issues to Fix

### Issue 1: "Exceeds limit! Max: TSh 1,000" Message
**Cause:** Browser cache showing old code
**Fix:** Hard refresh browser

### Issue 2: "Payment Link Not Found" Error
**Cause:** Database RLS blocking public access
**Fix:** Apply database migration

---

## IMMEDIATE ACTIONS

### Step 1: Clear Browser Cache
**For Users:**
- Press: `Ctrl + Shift + R` (Windows/Linux)
- Or: `Cmd + Shift + R` (Mac)
- Or: Clear browser cache completely

**Result:** Old validation message will disappear

### Step 2: Apply Database Migration
**For Developers:**
```bash
npx supabase db push
```

**What it does:**
- Disables RLS on payment_links table
- Allows public access to payment links
- Fixes "Payment Link Not Found" error

### Step 3: Rebuild Application
```bash
npm run build
```

**Result:** Fresh dist/ files without old code

### Step 4: Deploy
```bash
# Upload dist/ to uzanasi.online
```

---

## VERIFICATION

### Test 1: Reseller Pricing
1. Go to Reseller Dashboard
2. Click "Add Product"
3. Select "Abaya - TSh 1,000"
4. Enter price: 1000
5. **Expected:** Green checkmark with "Valid price (0.0% markup)"
6. **NOT:** "Exceeds limit! Max: TSh 1,000"

### Test 2: Payment Link
1. Create payment link
2. Visit: `https://uzanasi.online/pay/{linkId}`
3. **Expected:** Payment details displayed
4. **NOT:** "Payment Link Not Found"

---

## SUMMARY

| Issue | Cause | Fix | Status |
|-------|-------|-----|--------|
| "Exceeds limit" message | Browser cache | Hard refresh | ✅ Ready |
| "Payment Link Not Found" | RLS blocking | DB migration | ✅ Ready |

**All fixes are ready to deploy!**
