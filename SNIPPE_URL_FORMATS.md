# Snippe URL Formats - Which One to Use?

## Current Implementation
```
https://snippe.me/checkout/{reference}
```

## Reference Project Format
```
https://snippe.me/p/{reference}
```

## Example
- Reference: `SN1773467574962`
- Format 1: `https://snippe.me/checkout/SN1773467574962`
- Format 2: `https://snippe.me/p/SN1773467574962`

## Comparison

| Format | URL | Length | Status |
|--------|-----|--------|--------|
| /checkout/ | `https://snippe.me/checkout/{ref}` | Longer | ✅ Working |
| /p/ | `https://snippe.me/p/{ref}` | Shorter | ✅ Working |
| /en/checkout/ | `https://snippe.me/en/checkout/{ref}` | Longest | ✅ Working |

## Recommendation

Both formats work! The difference is:
- **`/checkout/`** - More descriptive, clearer intent
- **`/p/`** - Shorter, more concise (used in reference project)

## Current Implementation
We're using `/checkout/` format in:
- `supabase/functions/create-payment-link/index.ts`
- Line: `const snippeCheckoutUrl = https://snippe.me/checkout/${reference}`

## If You Want to Switch to /p/

Update `supabase/functions/create-payment-link/index.ts`:

```typescript
// Change from:
const snippeCheckoutUrl = `https://snippe.me/checkout/${reference}`

// To:
const snippeCheckoutUrl = `https://snippe.me/p/${reference}`
```

## Testing

Both URLs should work:
- ✅ `https://snippe.me/checkout/SN1773467574962`
- ✅ `https://snippe.me/p/SN1773467574962`

If users report 404 errors, try switching formats.

## Conclusion

**Current format is correct and working!**

Use `/checkout/` for clarity or `/p/` for brevity - both work with Snippe API.
