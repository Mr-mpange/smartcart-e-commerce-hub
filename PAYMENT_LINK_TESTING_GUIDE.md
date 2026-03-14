# Payment Link Testing Guide

## ✅ System Status

All components are built and ready:
- ✅ PaymentPage component updated with redirect logic
- ✅ Build completed successfully
- ✅ dist/ folder ready for deployment
- ✅ .htaccess configured for routing

---

## How to Test the Payment Link

### Test URL
```
https://uzanasi.online/pay/4a727d89-0500-41b0-9cc3-9a7d43dc263f
```

### Expected Behavior

1. **Page Loads** (0-2 seconds)
   - Shows payment details
   - Amount: TSh 1000
   - Reference: SN17734302808952133
   - Status: Active

2. **Auto-Redirect** (After 2 seconds)
   - Redirects to Snippe checkout
   - URL: `https://snippe.me/p/SN17734302808952133`
   - User can pay via M-Pesa, Tigo Pesa, or Airtel Money

3. **Payment Confirmation**
   - After payment, Snippe sends webhook
   - Payment status updates to "paid"
   - User sees confirmation

---

## Browser Testing Steps

### Step 1: Open Developer Tools
1. Visit: `https://uzanasi.online/pay/4a727d89-0500-41b0-9cc3-9a7d43dc263f`
2. Press `F12` to open Developer Tools
3. Go to **Console** tab

### Step 2: Check Console Logs
You should see:
```
Fetching payment link: 4a727d89-0500-41b0-9cc3-9a7d43dc263f
Response data: {...}
Payment link loaded: {...}
Redirecting to Snippe checkout...
Snippe checkout URL: https://snippe.me/p/SN17734302808952133
```

### Step 3: Check Network Tab
1. Go to **Network** tab
2. Look for requests to:
   - `https://qpojzblbodlphwzfpxbi.supabase.co/rest/v1/payment_links?...`
   - Should return HTTP 200 with payment link data

### Step 4: Verify Redirect
1. After 2 seconds, page should redirect
2. URL should change to Snippe checkout
3. You should see Snippe payment page

---

## Code Implementation

### PaymentPage.tsx Changes

```typescript
// Fetch payment link from database
const { data, error } = await publicSupabase
  .from('payment_links')
  .select('*')
  .eq('id', linkId)
  .single();

// If we have a Snippe reference, redirect to Snippe checkout
if (data.snippe_reference) {
  console.log('Redirecting to Snippe checkout...');
  const snippeCheckoutUrl = `https://snippe.me/p/${data.snippe_reference}`;
  console.log('Snippe checkout URL:', snippeCheckoutUrl);
  
  // Redirect after 2 seconds
  setTimeout(() => {
    window.location.href = snippeCheckoutUrl;
  }, 2000);
}
```

---

## Deployment Checklist

Before deploying to uzanasi.online:

- [ ] Build completed: `npm run build`
- [ ] dist/ folder exists
- [ ] dist/.htaccess exists
- [ ] dist/index.html exists
- [ ] dist/assets/ folder exists
- [ ] .env file has correct environment variables
- [ ] Payment link exists in database

### Deploy Steps

1. **Build the app**
   ```bash
   npm run build
   ```

2. **Upload to Hostinger**
   - Connect via FTP/SFTP
   - Upload contents of `dist/` to `public_html/`
   - Ensure `.htaccess` is in root

3. **Verify Deployment**
   - Visit: `https://uzanasi.online/`
   - Test payment link: `https://uzanasi.online/pay/4a727d89-0500-41b0-9cc3-9a7d43dc263f`
   - Check browser console for logs

---

## Troubleshooting

### Issue: Page doesn't redirect to Snippe
**Solution**:
1. Check browser console for errors
2. Verify payment link exists in database
3. Verify snippe_reference is not null
4. Check if JavaScript is enabled

### Issue: 404 Not Found
**Solution**:
1. Verify .htaccess is in public_html root
2. Check if dist/ files are uploaded
3. Verify index.html exists

### Issue: Payment link not found
**Solution**:
1. Check if payment link ID is correct
2. Query database to verify link exists
3. Check Supabase RLS settings

### Issue: Redirect doesn't work
**Solution**:
1. Check browser console for JavaScript errors
2. Verify Snippe reference format (should start with "SN")
3. Try manual redirect: `https://snippe.me/p/SN17734302808952133`

---

## Testing Checklist

- [ ] Payment link loads
- [ ] Shows correct amount (TSh 1000)
- [ ] Shows correct reference (SN17734302808952133)
- [ ] Shows correct status (Active)
- [ ] Redirects to Snippe after 2 seconds
- [ ] Snippe checkout page loads
- [ ] Can select payment method
- [ ] Payment can be completed

---

## Payment Flow Diagram

```
User visits payment link
        ↓
PaymentPage loads
        ↓
Fetches payment link from database
        ↓
Shows payment details (2 seconds)
        ↓
Redirects to Snippe checkout
        ↓
User selects payment method
        ↓
User completes payment
        ↓
Snippe sends webhook
        ↓
Payment status updates to "paid"
        ↓
User sees confirmation
```

---

## Files Modified

- `src/pages/PaymentPage.tsx` - Added redirect logic
- `dist/` - Rebuilt with latest changes

## Files Ready for Deployment

- `dist/index.html`
- `dist/.htaccess`
- `dist/assets/` (all files)
- `dist/favicon.ico`
- `dist/robots.txt`
- `dist/placeholder.svg`

---

**Status**: ✅ READY FOR TESTING AND DEPLOYMENT

**Next Action**: Deploy dist/ to uzanasi.online and test the payment link
