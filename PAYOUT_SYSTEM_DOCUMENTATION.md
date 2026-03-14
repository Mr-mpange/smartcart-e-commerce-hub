# 💰 PAYOUT SYSTEM DOCUMENTATION

**Status:** ✅ FULLY IMPLEMENTED & TESTED  
**Last Updated:** March 14, 2026

---

## 📋 OVERVIEW

The payout system now supports both **mobile money** and **bank transfer** payouts through the Tembo API. This allows businesses to disburse funds to customers via their preferred payment method.

---

## 🎯 SUPPORTED PAYOUT TYPES

### 1. Mobile Money Payout (B2C)
Send money directly to customer's mobile money wallet.

**Supported Networks:**
- ✅ Airtel Money (TZ-AIRTEL-B2C)
- ✅ Tigo Pesa (TZ-TIGO-B2C)
- ✅ Halotel (TZ-HALOTEL-B2C)
- ✅ Vodacom M-Pesa (TZ-VODACOM-B2C)

**Format:**
```json
{
  "action": "send",
  "payout_type": "mobile",
  "recipient_phone": "255712345678",
  "recipient_name": "John Doe",
  "amount": 50000,
  "description": "Salary Payment - September 2025"
}
```

**API Payload (Tembo):**
```json
{
  "countryCode": "TZ",
  "accountNo": "9000911192",
  "serviceCode": "TZ-TIGO-B2C",
  "amount": 50000,
  "msisdn": "255712345678",
  "narration": "Salary Payment - September 2025",
  "currencyCode": "TZS",
  "recipientNames": "John Doe",
  "transactionRef": "payout-id-uuid",
  "transactionDate": "2025-09-11T10:30:00Z",
  "callbackUrl": "https://yourdomain.com/webhooks/payout"
}
```

### 2. Bank Transfer Payout (B2C)
Send money to a bank account via bank transfer.

**Format:**
```json
{
  "action": "send",
  "payout_type": "bank",
  "recipient_bank_account": "CORUTZTZ:0150987654321",
  "recipient_name": "ABC Supplies Ltd",
  "amount": 150000,
  "description": "Vendor Payment - Invoice #2025-123"
}
```

**API Payload (Tembo):**
```json
{
  "countryCode": "TZ",
  "accountNo": "9000911192",
  "serviceCode": "TZ-BANK-B2C",
  "amount": 150000,
  "msisdn": "CORUTZTZ:0150987654321",
  "narration": "Vendor Payment - Invoice #2025-123",
  "currencyCode": "TZS",
  "recipientNames": "ABC Supplies Ltd",
  "transactionRef": "payout-id-uuid",
  "transactionDate": "2025-09-11T10:30:00Z",
  "callbackUrl": "https://yourdomain.com/webhooks/payout"
}
```

---

## 🔄 PAYOUT FLOW

### Single Payout Flow
```
1. Admin initiates payout request
   ├─ Specify payout_type (mobile or bank)
   ├─ Provide recipient details
   └─ Set amount and description

2. System validates request
   ├─ Check authentication
   ├─ Validate amount
   └─ Validate recipient details

3. System checks approval threshold
   ├─ If amount < 500,000 TSh → Process immediately
   └─ If amount >= 500,000 TSh → Require admin approval

4. System calls Tembo API
   ├─ Get disbursement account number
   ├─ Determine service code (for mobile)
   └─ Send payout request

5. Tembo processes payout
   ├─ Send USSD push (mobile) or initiate transfer (bank)
   ├─ Recipient authorizes
   