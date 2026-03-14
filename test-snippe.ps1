# Snippe Integration Test Script (PowerShell)
# Tests if we can create payments on Snippe

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "SNIPPE INTEGRATION TEST" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Check if SNIPPE_API_KEY is set
$apiKey = $env:SNIPPE_API_KEY
if ([string]::IsNullOrEmpty($apiKey)) {
    Write-Host "❌ SNIPPE_API_KEY not set!" -ForegroundColor Red
    Write-Host "   Set it with: `$env:SNIPPE_API_KEY='snp_5208ca969ae0fbeee354612f424a2ccb41992be6b14cfb1269289883a940c27b'" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ SNIPPE_API_KEY is set" -ForegroundColor Green
Write-Host "   Key length: $($apiKey.Length) characters" -ForegroundColor Gray

# Test 1: Create a test payment
Write-Host ""
Write-Host "[TEST 1] Creating test payment on Snippe..." -ForegroundColor Cyan

$headers = @{
    "Authorization" = "Bearer $apiKey"
    "Content-Type" = "application/json"
    "Idempotency-Key" = "test-$(Get-Date -UFormat %s)"
}

$body = @{
    payment_type = "mobile"
    details = @{
        amount = 1000
        currency = "TZS"
    }
    phone_number = "+255700000000"
    customer = @{
        firstname = "Test"
        lastname = "User"
        email = "test@example.com"
    }
    webhook_url = "https://qpojzblbodlphwzfpxbi.supabase.co/functions/v1/snippe-webhook"
    redirect_url = "https://uzanasi.online/pay/test-123"
    description = "Test payment"
} | ConvertTo-Json

try {
    $response = Invoke-WebRequest -Uri "https://api.snippe.sh/v1/payments" `
        -Method POST `
        -Headers $headers `
        -Body $body `
        -ContentType "application/json" `
        -ErrorAction SilentlyContinue

    $data = $response.Content | ConvertFrom-Json
    
    Write-Host "Snippе Response:" -ForegroundColor Gray
    Write-Host ($data | ConvertTo-Json -Depth 10) -ForegroundColor Gray
    
    # Extract reference
    $reference = $data.data.reference
    
    if ($reference) {
        Write-Host ""
        Write-Host "✅ Payment created successfully!" -ForegroundColor Green
        Write-Host "   Reference: $reference" -ForegroundColor Green
        Write-Host "   Checkout URL: https://snippe.me/p/$reference" -ForegroundColor Green
        
        # Test 2: Try to access the payment link
        Write-Host ""
        Write-Host "[TEST 2] Testing if payment link is accessible..." -ForegroundColor Cyan
        
        try {
            $linkResponse = Invoke-WebRequest -Uri "https://snippe.me/p/$reference" `
                -Method HEAD `
                -ErrorAction SilentlyContinue
            
            Write-Host "✅ Payment link is accessible (HTTP $($linkResponse.StatusCode))" -ForegroundColor Green
        } catch {
            $statusCode = $_.Exception.Response.StatusCode.Value__
            Write-Host "⚠️  Payment link returned HTTP $statusCode" -ForegroundColor Yellow
        }
    } else {
        Write-Host ""
        Write-Host "❌ Failed to create payment" -ForegroundColor Red
        Write-Host "   Check the response above for error details" -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Failed to call Snippе API" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    
    # Try to show response body
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "   Response: $responseBody" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "TEST COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
