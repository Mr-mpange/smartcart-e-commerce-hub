# Debug Briq API Endpoints
# This script tests both OTP and SMS endpoints to see why SMS might not be working

Write-Host "Debug Briq API Endpoints" -ForegroundColor Green
Write-Host "Checking why OTP works but SMS doesn't" -ForegroundColor Yellow
Write-Host "=================================================="

# Configuration
$SUPABASE_URL = "https://qpojzblbodlphwzfpxbi.supabase.co"
$SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFwb2p6Ymxib2RscGh3emZweGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzMzMTUwODEsImV4cCI6MjA4ODg5MTA4MX0.aPIcSd3-0kcn44OMiVwshassQwA5v0kbUv5Q9kZNAVg"
$FUNCTION_URL = "$SUPABASE_URL/functions/v1/briq-sms"

# Headers for all requests
$headers = @{
    "Authorization" = "Bearer $SUPABASE_ANON_KEY"
    "Content-Type" = "application/json"
}

# Test 1: OTP (Working)
Write-Host ""
Write-Host "TEST 1: OTP API (Should work)" -ForegroundColor Green
$otpPayload = @{
    action = "generate_otp"
    email = "kilindosaid771@gmail.com"
} | ConvertTo-Json

Write-Host "Payload: $otpPayload"

try {
    $response = Invoke-WebRequest -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $otpPayload -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Success: $($jsonResponse.success)"
    if ($jsonResponse.briq_response) {
        Write-Host "Briq Response: $($jsonResponse.briq_response | ConvertTo-Json)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "--------------------------------------------------"

# Test 2: Direct SMS (Not working)
Write-Host ""
Write-Host "TEST 2: SMS API (Not working)" -ForegroundColor Red
$smsPayload = @{
    phone_number = "+255683859574"
    message = "Debug test SMS"
} | ConvertTo-Json

Write-Host "Payload: $smsPayload"

try {
    $response = Invoke-WebRequest -Uri $FUNCTION_URL -Method POST -Headers $headers -Body $smsPayload -UseBasicParsing
    Write-Host "Status: $($response.StatusCode)" -ForegroundColor Green
    $jsonResponse = $response.Content | ConvertFrom-Json
    Write-Host "Success: $($jsonResponse.success)"
    Write-Host "Message: $($jsonResponse.message)"
    if ($jsonResponse.error) {
        Write-Host "Error: $($jsonResponse.error)" -ForegroundColor Red
    }
    if ($jsonResponse.details) {
        Write-Host "Details: $($jsonResponse.details | ConvertTo-Json)"
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorResponse = $reader.ReadToEnd()
        Write-Host "Error Response: $errorResponse" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "=================================================="
Write-Host "ANALYSIS:" -ForegroundColor Yellow
Write-Host "- OTP uses: https://karibu.briq.tz/otp/request"
Write-Host "- SMS uses: https://karibu.briq.tz/v1/message/send-instant"
Write-Host "- Both should use same X-API-Key authentication"
Write-Host "- Check if SMS endpoint requires different parameters"
Write-Host "=================================================="