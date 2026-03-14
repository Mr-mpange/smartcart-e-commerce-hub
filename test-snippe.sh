#!/bin/bash

# Snippe Integration Test Script
# Tests if we can create payments on Snippe

echo "=========================================="
echo "SNIPPE INTEGRATION TEST"
echo "=========================================="

# Check if SNIPPE_API_KEY is set
if [ -z "$SNIPPE_API_KEY" ]; then
    echo "❌ SNIPPE_API_KEY not set!"
    echo "   Set it with: export SNIPPE_API_KEY=your-key"
    exit 1
fi

echo "✅ SNIPPE_API_KEY is set"
echo "   Key length: ${#SNIPPE_API_KEY} characters"

# Test 1: Create a test payment
echo ""
echo "[TEST 1] Creating test payment on Snippe..."

RESPONSE=$(curl -s -X POST https://api.snippe.sh/v1/payments \
  -H "Authorization: Bearer $SNIPPE_API_KEY" \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: test-$(date +%s)" \
  -d '{
    "payment_type": "mobile",
    "details": {
      "amount": 1000,
      "currency": "TZS"
    },
    "phone_number": "+255700000000",
    "customer": {
      "firstname": "Test",
      "lastname": "User",
      "email": "test@example.com"
    },
    "webhook_url": "https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/snippe-webhook",
    "redirect_url": "https://uzanasi.online/pay/test-123",
    "description": "Test payment"
  }')

echo "Snippе Response:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

# Extract reference
REFERENCE=$(echo "$RESPONSE" | jq -r '.data.reference' 2>/dev/null)

if [ ! -z "$REFERENCE" ] && [ "$REFERENCE" != "null" ]; then
    echo ""
    echo "✅ Payment created successfully!"
    echo "   Reference: $REFERENCE"
    echo "   Checkout URL: https://snippe.me/p/$REFERENCE"
    
    # Test 2: Try to access the payment link
    echo ""
    echo "[TEST 2] Testing if payment link is accessible..."
    
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "https://snippe.me/p/$REFERENCE")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ Payment link is accessible (HTTP $HTTP_CODE)"
    else
        echo "⚠️  Payment link returned HTTP $HTTP_CODE"
    fi
else
    echo ""
    echo "❌ Failed to create payment"
    echo "   Check the response above for error details"
fi

echo ""
echo "=========================================="
echo "TEST COMPLETE"
echo "=========================================="
